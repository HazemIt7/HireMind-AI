import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { LocalLlmService } from '../cv/local-llm.service';
import { CandidatesService } from '../cv/candidates.service';

export interface InterviewSession {
  sessionId: string;
  jobId: string;
  jobTitle: string;
  skills: string[];
  candidateName?: string;
  candidateId?: string;
  candidateEmail?: string;
  currentStep: number;
  maxSteps: number;
  difficultyLevel: number; // 1 to 5
  history: {
    step?: number;
    question: string;
    answer?: string;
    score?: number;
    feedback?: string;
    topic: string;
  }[];
  isFinished: boolean;
  totalScore: number;
}

@Injectable()
export class AdaptiveInterviewService {
  private readonly logger = new Logger(AdaptiveInterviewService.name);
  private sessions: Map<string, InterviewSession> = new Map();

  constructor(
    @Inject(forwardRef(() => LocalLlmService))
    private readonly localLlmService: LocalLlmService,
    @Inject(forwardRef(() => CandidatesService))
    private readonly candidatesService: CandidatesService,
  ) {}

  /**
   * Start a new adaptive interview session with LLM-generated questions
   */
  async startSession(
    jobId: string,
    candidateName?: string,
    jobTitle?: string,
    skills?: string[],
    description?: string,
    candidateId?: string,
    candidateEmail?: string,
  ): Promise<InterviewSession> {
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const title = jobTitle || 'Poste Technique';

    // Generate dynamic 3-step questions using Local Ollama LLM / dynamic NLP generator
    const generatedQs = await this.localLlmService.generateInterviewQuestionsWithLocalLlm(
      title,
      description,
      skills || [],
    );

    const session: InterviewSession = {
      sessionId,
      jobId,
      jobTitle: title,
      skills: skills || [],
      candidateName: candidateName || 'Candidat',
      candidateId,
      candidateEmail,
      currentStep: 1,
      maxSteps: 3,
      difficultyLevel: 1,
      history: generatedQs.map((g, i) => ({
        step: i + 1,
        question: g.question,
        topic: g.topic,
      })),
      isFinished: false,
      totalScore: 0,
    };

    this.sessions.set(sessionId, session);
    this.logger.log(`Started interview session '${sessionId}' for candidate '${session.candidateName}' (${session.candidateEmail || 'no-email'}) on job '${title}'`);
    return session;
  }

  /**
   * Process incoming answer and calculate adaptive next question using Local Ollama LLM
   */
  async processAnswer(sessionId: string, answerText: string) {
    let session = this.sessions.get(sessionId);

    // Fallback auto-create session if requested without prior start
    if (!session) {
      session = {
        sessionId,
        jobId: 'job_default',
        jobTitle: 'Poste Technique',
        skills: ['Software', 'Architecture'],
        candidateName: 'Candidat',
        currentStep: 1,
        maxSteps: 3,
        difficultyLevel: 1,
        history: [
          {
            step: 1,
            question: 'Bonjour ! Pouvez-vous présenter vos compétences clés et votre expérience pour ce poste ?',
            topic: 'Architecture & Fondations',
          },
        ],
        isFinished: false,
        totalScore: 0,
      };
      this.sessions.set(sessionId, session);
    }

    const currentHistory = session.history[session.currentStep - 1] || session.history[session.history.length - 1];
    currentHistory.answer = answerText;

    // Evaluate answer technical depth with Local Ollama LLM
    const evalResult = await this.localLlmService.evaluateAnswerWithLocalLlm(
      currentHistory.question,
      answerText,
      session.jobTitle,
    );

    const evaluatedScore = evalResult.score;
    currentHistory.score = evaluatedScore;
    currentHistory.feedback = evalResult.feedback;

    // Adapt difficulty level
    if (evaluatedScore >= 80 && session.difficultyLevel < 3) {
      session.difficultyLevel += 1;
    } else if (evaluatedScore < 50 && session.difficultyLevel > 1) {
      session.difficultyLevel -= 1;
    }

    session.currentStep += 1;
    session.totalScore += evaluatedScore;

    // Check if interview is finished
    if (session.currentStep > session.maxSteps) {
      session.isFinished = true;
      const finalScore = Math.round(session.totalScore / session.maxSteps);
      this.sessions.set(sessionId, session);

      // Format updated history from actual session
      const updatedHistory = session.history.map((h, i) => ({
        step: i + 1,
        topic: h.topic,
        question: h.question,
        answer: h.answer || answerText,
        score: h.score || evaluatedScore,
        feedback: h.feedback || evalResult.feedback,
      }));

      // Automatically Synchronize and Advance Candidate in Centralized MongoDB ATS Pipeline
      try {
        const allCandidates = await this.candidatesService.findAll();
        
        let cand = allCandidates.find((c: any) => {
          if (session?.candidateId && c.id === session.candidateId) return true;
          if (session?.candidateEmail && c.email && c.email.toLowerCase() === session.candidateEmail.toLowerCase()) return true;
          if (session?.candidateName && c.fullName) {
            const sName = session.candidateName.toLowerCase().trim();
            const cName = c.fullName.toLowerCase().trim();
            return sName === cName || sName.includes(cName) || cName.includes(sName);
          }
          return false;
        });

        if (cand) {
          await this.candidatesService.upsert({
            ...cand,
            status: 'tech_interview',
            matchScore: Math.max(cand.matchScore || 80, finalScore),
            interviewHistory: updatedHistory,
          });

          this.logger.log(`Candidate '${cand.fullName}' (${cand.id}) advanced to 'tech_interview' with real session history (${updatedHistory.length} Qs)`);
        } else {
          // Create new candidate entry in MongoDB if not existing yet
          const newCand = {
            id: session.candidateId || `cand_${Date.now()}`,
            fullName: session.candidateName || 'Candidat Évalué',
            email: session.candidateEmail || 'candidat@hiremind.ai',
            roleApplied: session.jobTitle,
            matchScore: finalScore,
            status: 'tech_interview',
            skills: session.skills.length > 0 ? session.skills : ['Compétences Générales'],
            appliedDate: new Date().toISOString().split('T')[0],
            interviewHistory: updatedHistory,
            summary: `Entretien IA validé avec ${finalScore}% pour le poste de ${session.jobTitle}.`,
          };
          await this.candidatesService.upsert(newCand);
          this.logger.log(`New Candidate '${newCand.fullName}' registered in MongoDB ATS with interview history.`);
        }
      } catch (err: any) {
        this.logger.warn(`Failed to auto-sync candidate to ATS: ${err.message}`);
      }

      return {
        sessionId,
        isFinished: true,
        isCompleted: true,
        score: finalScore,
        averageScore: finalScore,
        summaryScore: finalScore,
        scoreOverall: finalScore,
        feedback: 'Entretien IA validé avec succès.',
        summary: `Score global de ${finalScore}%. Le dossier du candidat a été automatiquement avancé à l'étape 'Entretien Technique' du pipeline ATS.`,
      };
    }

    // Pick next pre-generated question from session.history
    const nextQObj = session.history[session.currentStep - 1] || {
      step: session.currentStep,
      question: `Comment gérez-vous la qualité, la sécurité et la performance sur le poste d'${session.jobTitle} ?`,
      topic: 'Optimisation & Performance',
    };

    this.sessions.set(sessionId, session);

    return {
      sessionId,
      isFinished: false,
      isCompleted: false,
      currentStep: session.currentStep,
      maxSteps: session.maxSteps,
      difficultyLevel: session.difficultyLevel,
      score: evaluatedScore,
      previousAnswerScore: evaluatedScore,
      feedback: evalResult.feedback,
      nextQuestion: nextQObj.question,
      nextTopic: nextQObj.topic,
    };
  }

  /**
   * Get complete evaluation summary of an interview session
   */
  getSessionSummary(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { error: 'Session non trouvée' };
    }

    const avgScore = Math.round(session.totalScore / Math.max(1, session.history.filter(h => h.score !== undefined).length));

    return {
      sessionId: session.sessionId,
      jobId: session.jobId,
      candidateName: session.candidateName,
      overallScore: avgScore,
      maxDifficultyReached: session.difficultyLevel,
      isFinished: session.isFinished,
      evaluationBreakdown: session.history.map((h, i) => ({
        step: i + 1,
        topic: h.topic,
        question: h.question,
        answer: h.answer || 'Non répondu',
        score: h.score || 0,
        feedback: h.feedback || 'En attente',
      })),
    };
  }
}

import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { LocalLlmService } from '../cv/local-llm.service';

export interface InterviewSession {
  sessionId: string;
  jobId: string;
  jobTitle: string;
  skills: string[];
  candidateName?: string;
  currentStep: number;
  maxSteps: number;
  difficultyLevel: number; // 1 to 5
  history: {
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
      candidateName: candidateName || 'Candidat IA',
      currentStep: 1,
      maxSteps: 3,
      difficultyLevel: 1,
      history: generatedQs.map((g) => ({
        question: g.question,
        topic: g.topic,
      })),
      isFinished: false,
      totalScore: 0,
    };

    this.sessions.set(sessionId, session);
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
        skills: [],
        candidateName: 'Candidat IA',
        currentStep: 1,
        maxSteps: 3,
        difficultyLevel: 1,
        history: [
          {
            question: 'Pouvez-vous présenter vos compétences clés et votre expérience pour ce poste ?',
            topic: 'Présentation & Compétences',
          },
        ],
        isFinished: false,
        totalScore: 0,
      };
      this.sessions.set(sessionId, session);
    }

    const currentHistory = session.history[session.history.length - 1];
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
      return {
        sessionId,
        isFinished: true,
        isCompleted: true,
        summaryScore: finalScore,
        scoreOverall: finalScore,
        feedback: 'Entretien terminé avec succès. Profil évalué par l\'arbre décisionnel adaptatif.',
      };
    }

    // Pick next pre-generated question from session.history
    const nextQObj = session.history[session.currentStep - 1] || {
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
      previousAnswerScore: evaluatedScore,
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

  /**
   * Evaluate answer using semantic density heuristic
   */
  private evaluateAnswerQuality(text: string, currentLevel: number): number {
    const lengthBonus = Math.min(25, text.length / 4);
    const keywords = ['architecture', 'clean', 'wazuh', 'siem', 'pentest', 'ansible', 'hardening', 'kubernetes', 'terraform', 'aws', 'docker', 'ci/cd', 'nestjs', 'postgresql', 'zerotrust', 'mtls', 'async', 'performance'];
    const matchedCount = keywords.filter(k => text.toLowerCase().includes(k)).length;
    const keywordScore = Math.min(50, matchedCount * 15);
    const baseScore = 35 + lengthBonus + keywordScore;
    return Math.min(98, Math.max(55, Math.round(baseScore)));
  }
}

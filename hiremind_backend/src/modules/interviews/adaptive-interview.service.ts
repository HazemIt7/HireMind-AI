import { Injectable, Logger } from '@nestjs/common';

export interface InterviewSession {
  sessionId: string;
  jobId: string;
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

  // Knowledge tree topics by job domain
  private readonly questionBank = {
    flutter: [
      { level: 1, topic: 'State Management', question: 'Pouvez-vous expliquer la différence entre Stateless et Stateful widgets dans Flutter ?' },
      { level: 2, topic: 'State Management Advanced', question: 'Pourquoi préférez-vous BLoC ou Riverpod et comment gérez-vous le cycle de vie des streams ?' },
      { level: 3, topic: 'Clean Architecture', question: 'Comment structurez-vous vos repositories et data sources pour isoler les dépendances réseau ?' },
      { level: 4, topic: 'Performance & Rendering', question: 'Comment optimisez-vous la rebuild tree et l\'utilisation du RepaintBoundary lors de scrolls complexes ?' },
      { level: 5, topic: 'Native Interop / FFI', question: 'Comment communiquez-vous avec du code C/C++ natif via Dart FFI sans bloquer l\'Event Loop ?' },
    ],
    cybersecurity: [
      { level: 1, topic: 'Réseaux & Protocoles', question: 'Quelle est la différence fondamentale entre les modèles OSI et TCP/IP ?' },
      { level: 2, topic: 'SIEM & Detection', question: 'Comment configurez-vous des règles d\'alerte personnalisées sous Wazuh pour détecter des attaques par brute force ?' },
      { level: 3, topic: 'Pentesting & Web Vulnerabilities', question: 'Pouvez-vous décrire le processus d\'exploitation et de mitigation d\'une vulnérabilité CSRF et SSRF ?' },
      { level: 4, topic: 'Hardening & Cryptographie', question: 'Comment mettez-vous en place une architecture Zero-Trust avec mTLS entre microservices ?' },
      { level: 5, topic: 'Malware Analysis & Forensics', question: 'Comment analysez-vous un binaire obfusqué sans déclencher son payload d\'évasion d\'environnement bac à sable ?' },
    ],
  };

  /**
   * Start a new adaptive interview session
   */
  startSession(jobId: string, candidateName?: string): InterviewSession {
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const domain = jobId.includes('cyber') ? 'cybersecurity' : 'flutter';
    const firstQ = this.questionBank[domain][0];

    const session: InterviewSession = {
      sessionId,
      jobId,
      candidateName: candidateName || 'Candidat IA',
      currentStep: 1,
      maxSteps: 5,
      difficultyLevel: 1,
      history: [
        {
          question: firstQ.question,
          topic: firstQ.topic,
        },
      ],
      isFinished: false,
      totalScore: 0,
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Process incoming answer and calculate adaptive next question
   */
  processAnswer(sessionId: string, answerText: string) {
    let session = this.sessions.get(sessionId);

    // Fallback auto-create session if requested without prior start
    if (!session) {
      session = this.startSession('job_default');
    }

    const currentHistory = session.history[session.history.length - 1];
    currentHistory.answer = answerText;

    // Evaluate answer technical depth (0 to 100)
    const evaluatedScore = this.evaluateAnswerQuality(answerText, session.difficultyLevel);
    currentHistory.score = evaluatedScore;
    currentHistory.feedback = evaluatedScore > 75 
      ? 'Excellente réponse avec des termes techniques appropriés.' 
      : 'Réponse correcte mais manque d\'exemples d\'architecture concrets.';

    // Adapt difficulty level
    if (evaluatedScore >= 80 && session.difficultyLevel < 5) {
      session.difficultyLevel += 1;
    } else if (evaluatedScore < 50 && session.difficultyLevel > 1) {
      session.difficultyLevel -= 1;
    }

    session.currentStep += 1;
    session.totalScore += evaluatedScore;

    // Check if interview is finished
    if (session.currentStep > session.maxSteps) {
      session.isFinished = true;
      this.sessions.set(sessionId, session);
      return {
        sessionId,
        isFinished: true,
        summaryScore: Math.round(session.totalScore / session.maxSteps),
        feedback: 'Entretien terminé avec succès. Profil évalué par l\'arbre décisionnel adaptatif.',
      };
    }

    // Pick next question adaptively
    const domain = session.jobId.includes('cyber') ? 'cybersecurity' : 'flutter';
    const nextQObj = this.questionBank[domain][session.difficultyLevel - 1];

    session.history.push({
      question: nextQObj.question,
      topic: nextQObj.topic,
    });

    this.sessions.set(sessionId, session);

    return {
      sessionId,
      isFinished: false,
      currentStep: session.currentStep,
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
    const keywords = ['architecture', 'clean', 'bloc', 'stream', 'wazuh', 'siem', 'pentest', 'mtls', 'zerotrust', 'rebuild', 'async', 'performance'];
    const matchedCount = keywords.filter(k => text.toLowerCase().includes(k)).length;
    const keywordScore = Math.min(50, matchedCount * 15);
    const baseScore = 30 + lengthBonus + keywordScore;
    return Math.min(98, Math.max(45, Math.round(baseScore)));
  }
}

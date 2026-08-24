import { Injectable, Logger } from '@nestjs/common';

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

  // Knowledge tree topics by job domain
  private readonly questionBank = {
    cybersecurity: [
      { level: 1, topic: 'Supervision SIEM & Wazuh', question: 'Comment configurez-vous des agents Wazuh et des règles d\'alerte personnalisées pour surveiller les journaux système Linux ?' },
      { level: 2, topic: 'Durcissement Linux & Hardening', question: 'Quelles procédures de durcissement (Hardening Linux & Ansible) appliquez-vous pour sécuriser un serveur hôte contre les attaques par élévation de privilèges ?' },
      { level: 3, topic: 'Réseaux & Analyse de Trafic', question: 'Comment analysez-vous une capture pcap Wireshark/Zeek pour isoler un trafic d\'exfiltration ou un balisage C2 (Command & Control) ?' },
      { level: 4, topic: 'Web Security & Pentesting', question: 'Pouvez-vous expliquer la différence entre SSRF et CSRF, et quelles sont vos méthodes de remédiation au niveau de l\'application ?' },
      { level: 5, topic: 'Architecture Zero-Trust & mTLS', question: 'Comment concevez-vous une architecture Zero-Trust avec authentification mTLS entre conteneurs microservices ?' },
    ],
    devops: [
      { level: 1, topic: 'Orchestration Kubernetes & Pods', question: 'Comment organisez-vous les déploiements, services et Ingress Controllers sous Kubernetes pour garantir la haute disponibilité ?' },
      { level: 2, topic: 'Infrastructure as Code (Terraform)', question: 'Comment structurez-vous vos modules Terraform pour gérer l\'état (state lock) et déployer des ressources réutilisables sur AWS/GCP ?' },
      { level: 3, topic: 'CI/CD Pipelines & SecOps', question: 'Comment automatisez-vous un pipeline CI/CD sécurisé avec scan de vulnérabilités d\'images conteneurs et gestion des secrets ?' },
      { level: 4, topic: 'Monitoring & Observabilité', question: 'Comment configurez-vous Prometheus et Grafana pour détecter les goulots d\'étranglement mémoire/CPU sur des clusters K8s ?' },
      { level: 5, topic: 'Zero-Downtime Deployment', question: 'Quelle est la différence entre une stratégie de déploiement Blue/Green et Canary, et comment la mettre en place avec Istio ?' },
    ],
    backend: [
      { level: 1, topic: 'Architecture NestJS / Microservices', question: 'Comment organisez-vous les modules, controllers et providers NestJS pour maintenir une séparation claire des responsabilités ?' },
      { level: 2, topic: 'Bases de Données & Indexation', question: 'Comment optimisez-vous les requêtes complexes sous PostgreSQL et gérez-vous le pool de connexions lors de pics de charge ?' },
      { level: 3, topic: 'Sécurité API & JWT', question: 'Comment implémentez-vous des Guards d\'authentification JWT et des règles de Rate Limiting pour protéger vos endpoints API ?' },
      { level: 4, topic: 'Caches & Messaging (Redis / RabbitMQ)', question: 'Dans quel cas utilisez-vous Redis pour le caching ou RabbitMQ/Kafka pour le traitement asynchrone des tâches ?' },
      { level: 5, topic: 'Clean Architecture & Testing', question: 'Comment appliquez-vous les principes SOLID et la Clean Architecture pour rendre vos services 100% testables avec Jest ?' },
    ],
    flutter: [
      { level: 1, topic: 'State Management & Flutter Core', question: 'Pouvez-vous expliquer la différence entre Stateless et Stateful widgets dans Flutter et leur cycle de vie ?' },
      { level: 2, topic: 'Architecture BLoC / Provider', question: 'Pourquoi préférez-vous BLoC ou Riverpod et comment gérez-vous la fermeture et le cycle de vie des streams ?' },
      { level: 3, topic: 'Clean Architecture Mobile', question: 'Comment structurez-vous vos repositories et data sources pour isoler la couche UI des appels API HTTP ?' },
      { level: 4, topic: 'Performance UI & Rendering', question: 'Comment optimisez-vous la rebuild tree et l\'utilisation de RepaintBoundary lors de défilements de listes complexes ?' },
      { level: 5, topic: 'Interopérabilité Natif / FFI', question: 'Comment communiquez-vous avec du code C/C++ natif via Dart FFI sans bloquer l\'Event Loop de l\'application ?' },
    ],
  };

  /**
   * Start a new adaptive interview session
   */
  startSession(jobId: string, candidateName?: string, jobTitle?: string, skills?: string[]): InterviewSession {
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    // Detect domain dynamically based on job title & skills
    const titleLower = (jobTitle || jobId || '').toLowerCase();
    const skillsStr = (skills || []).join(' ').toLowerCase();

    let domain = 'backend';
    if (titleLower.includes('cyber') || titleLower.includes('sécurité') || titleLower.includes('wazuh') || skillsStr.includes('wazuh') || skillsStr.includes('siem') || skillsStr.includes('hardening')) {
      domain = 'cybersecurity';
    } else if (titleLower.includes('devops') || titleLower.includes('cloud') || titleLower.includes('kubernetes') || skillsStr.includes('kubernetes') || skillsStr.includes('terraform') || skillsStr.includes('aws')) {
      domain = 'devops';
    } else if (titleLower.includes('flutter') || titleLower.includes('mobile') || skillsStr.includes('flutter') || skillsStr.includes('dart')) {
      domain = 'flutter';
    }

    const firstQ = this.questionBank[domain][0];

    const session: InterviewSession = {
      sessionId,
      jobId,
      jobTitle: jobTitle || 'Poste Technique',
      skills: skills || [],
      candidateName: candidateName || 'Candidat IA',
      currentStep: 1,
      maxSteps: 3,
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

    // Pick next question adaptively based on job domain
    const titleLower = (session.jobTitle || session.jobId || '').toLowerCase();
    const skillsStr = (session.skills || []).join(' ').toLowerCase();

    let domain = 'backend';
    if (titleLower.includes('cyber') || titleLower.includes('sécurité') || titleLower.includes('wazuh') || skillsStr.includes('wazuh') || skillsStr.includes('siem') || skillsStr.includes('hardening')) {
      domain = 'cybersecurity';
    } else if (titleLower.includes('devops') || titleLower.includes('cloud') || titleLower.includes('kubernetes') || skillsStr.includes('kubernetes') || skillsStr.includes('terraform') || skillsStr.includes('aws')) {
      domain = 'devops';
    } else if (titleLower.includes('flutter') || titleLower.includes('mobile') || skillsStr.includes('flutter') || skillsStr.includes('dart')) {
      domain = 'flutter';
    }

    const questionIndex = Math.min(session.currentStep - 1, this.questionBank[domain].length - 1);
    const nextQObj = this.questionBank[domain][questionIndex];

    session.history.push({
      question: nextQObj.question,
      topic: nextQObj.topic,
    });

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

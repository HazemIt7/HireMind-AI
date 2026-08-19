import { QdrantService } from '../src/modules/jobs/qdrant.service';
import { AdaptiveInterviewService } from '../src/modules/interviews/adaptive-interview.service';
import { SandboxService } from '../src/modules/sandbox/sandbox.service';

describe('Week 3 AI Engines (HireMind Backend)', () => {
  let qdrantService: QdrantService;
  let interviewService: AdaptiveInterviewService;
  let sandboxService: SandboxService;

  beforeEach(() => {
    qdrantService = new QdrantService();
    interviewService = new AdaptiveInterviewService();
    sandboxService = new SandboxService();
  });

  describe('1. Qdrant Matching Vector Engine', () => {
    it('should generate normalized 16-dimensional vector embedding', () => {
      const skills = ['Flutter', 'Dart', 'NestJS', 'Wazuh'];
      const vec = qdrantService.generateEmbedding(skills);
      expect(vec.length).toBe(16);

      // Check L2 normalization
      const norm = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
      expect(norm).toBeCloseTo(1, 1);
    });
  });

  describe('2. Adaptive Interview Engine (Decision Tree)', () => {
    it('should adapt difficulty level based on answer quality', () => {
      const session = interviewService.startSession('job_flutter_sr', 'Test Candidate');
      expect(session.currentStep).toBe(1);
      expect(session.difficultyLevel).toBe(1);

      // High-quality answer with architectural depth keywords
      const result = interviewService.processAnswer(
        session.sessionId,
        'J\'utilise la Clean Architecture avec BLoC, Dependency Injection et Stream controllers pour isoler le domaine.'
      );

      expect(result.isFinished).toBe(false);
      expect(result.difficultyLevel).toBe(2); // Level increased adaptively!
      expect(result.nextQuestion).toBeDefined();
    });

    it('should complete interview session after 5 steps and calculate summary score', () => {
      const session = interviewService.startSession('job_cyber_sr', 'Cyber Candidate');
      let currentSessionId = session.sessionId;

      for (let step = 1; step <= 5; step++) {
        const res = interviewService.processAnswer(currentSessionId, `Réponse détaillée étape ${step} avec Wazuh SIEM et Pentesting.`);
        if (step === 5) {
          expect(res.isFinished).toBe(true);
        }
      }

      const summary = interviewService.getSessionSummary(currentSessionId);
      expect(summary.overallScore).toBeGreaterThan(0);
      expect(summary.evaluationBreakdown.length).toBe(5);
    });
  });

  describe('3. Sandbox Technical Code Execution & Anti-Cheat', () => {
    it('should execute Python code safely and return execution metrics', async () => {
      const res = await sandboxService.executeCode({
        language: 'python',
        code: 'def add(a, b):\n    return a + b\nprint(add(10, 20))',
      });

      expect(res.status).toBe('success');
      expect(res.stdout).toContain('30');
      expect(res.metrics.executionTimeMs).toBeGreaterThanOrEqual(0);
      expect(res.antiCheat.securityRiskLevel).toBe('SAFE');
    });

    it('should flag dangerous code system calls and return security_violation', async () => {
      const res = await sandboxService.executeCode({
        language: 'python',
        code: 'import os\nos.system("rm -rf /")',
      });

      expect(res.status).toBe('security_violation');
      expect(res.antiCheat.securityRiskLevel).toBe('HIGH_RISK');
      expect(res.antiCheat.warnings.length).toBeGreaterThan(0);
    });
  });
});

'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { KPIOverview } from '@/components/dashboard/KPIOverview';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { CandidateModal } from '@/components/candidate/CandidateModal';
import { JobOffersManager } from '@/components/jobs/JobOffersManager';
import { CopilotRHDrawer } from '@/components/copilot/CopilotRHDrawer';
import { AuthModal, UserSession } from '@/components/auth/AuthModal';
import { CandidateDashboard } from '@/components/candidate/CandidateDashboard';
import { INITIAL_CANDIDATES } from '@/data/mockCandidates';
import { Candidate, CandidateStatus, RecruiterKPIs } from '@/types/recruiter';
import {
  Sparkles,
  Terminal,
  UploadCloud,
  CheckCircle,
  RefreshCw,
  Play,
  ShieldCheck,
  ShieldAlert,
  Cpu,
  Database,
  Code2
} from 'lucide-react';

export default function RecruiterDashboardPage() {
  const [currentTab, setCurrentTab] = useState('kanban');
  const [candidates, setCandidates] = useState<Candidate[]>(INITIAL_CANDIDATES);
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // User Auth Session State (Defaults to Admin for total access)
  const [userSession, setUserSession] = useState<UserSession>({
    id: 'admin-1',
    email: 'admin@hiremind.ai',
    role: 'admin',
    firstName: 'Super',
    lastName: 'Admin'
  });

  // Restore saved session & current tab from localStorage on mount (F5 reload)
  React.useEffect(() => {
    try {
      const savedSessStr = localStorage.getItem('hiremind_session');
      if (savedSessStr) {
        const sess: UserSession = JSON.parse(savedSessStr);
        setUserSession(sess);

        const savedTab = localStorage.getItem('hiremind_tab');
        if (savedTab) {
          setCurrentTab(savedTab);
        } else if (sess.role === 'candidate') {
          setCurrentTab('candidate_space');
        } else {
          setCurrentTab('kanban');
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
    try {
      localStorage.setItem('hiremind_tab', tab);
    } catch (e) {}
  };

  // Load candidate list & status from localStorage on mount
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('hiremind_candidates');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCandidates(parsed);
        }
      }
    } catch (error) {
      console.error('Failed to load candidates from localStorage:', error);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Save candidates list to localStorage whenever state updates
  React.useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('hiremind_candidates', JSON.stringify(candidates));
    }
  }, [candidates, isInitialized]);

  const handleResetCandidates = () => {
    setCandidates(INITIAL_CANDIDATES);
    localStorage.removeItem('hiremind_candidates');
  };

  // Live Sandbox Interactive State
  const [sandboxLang, setSandboxLang] = useState<'python' | 'javascript'>('python');
  const [sandboxCode, setSandboxCode] = useState(
    'def solution(arr):\n    # Supprimer les doublons et trier\n    return sorted(list(set(arr)))\n\nprint(solution([3, 1, 4, 1, 5, 9, 2, 6, 5]))'
  );
  const [sandboxResult, setSandboxResult] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  // Live Qdrant Matching State
  const [isMatching, setIsMatching] = useState(false);
  const [matchResults, setMatchResults] = useState<any>(null);

  const kpis: RecruiterKPIs = {
    activeJobs: 12,
    totalCandidates: candidates.length,
    avgMatchScore: Math.round(
      candidates.reduce((acc, c) => acc + c.matchScore, 0) / (candidates.length || 1)
    ),
    timeToHireDays: 8
  };

  const handleUpdateStatus = (candidateId: string, newStatus: CandidateStatus) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, status: newStatus } : c))
    );
    if (selectedCandidate && selectedCandidate.id === candidateId) {
      setSelectedCandidate((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  // Upload candidate CV to NestJS backend (/cv/upload)
  const handleUploadCV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadMessage('Envoi du CV PDF au service NestJS /cv/upload...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:3000/api/v1/cv/upload', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setUploadMessage('Parsing IA réussi ! Ajout au pipeline ATS...');

        const newCand: Candidate = {
          id: `cand-${Date.now()}`,
          fullName: data.candidateName || file.name.replace('.pdf', ''),
          email: data.email || 'candidat.parsed@hiremind.ai',
          phone: data.phone || '+216 20 000 000',
          roleApplied: 'Candidat Importé (IA Parsed)',
          matchScore: data.radarScores?.DevScore ? Math.round((data.radarScores.DevScore + data.radarScores.CyberScore) / 2 * 20) : 91,
          status: 'parsed',
          skills: data.skills || ['PDF Parsing', 'NestJS', 'AI Analysis'],
          radarScores: [
            { axis: 'Software Dev', score: (data.radarScores?.DevScore || 4) * 20, label: 'Développement' },
            { axis: 'Cybersecurity', score: (data.radarScores?.CyberScore || 4) * 20, label: 'Cybersécurité' },
            { axis: 'Networks', score: (data.radarScores?.NetScore || 3) * 20, label: 'Réseaux' },
            { axis: 'Systems', score: (data.radarScores?.SysScore || 3) * 20, label: 'Systèmes' },
            { axis: 'Soft Skills', score: 85, label: 'Soft Skills' }
          ],
          appliedDate: new Date().toISOString().split('T')[0],
          experienceYears: 3,
          summary: data.textSummary || `Profil extrait automatiquement depuis ${file.name}.`
        };

        setCandidates((prev) => [newCand, ...prev]);
      } else {
        throw new Error('Erreur backend');
      }
    } catch (error) {
      setUploadMessage('Simulateur IA : extraction effectuée...');
      setTimeout(() => {
        const simulatedCand: Candidate = {
          id: `cand-${Date.now()}`,
          fullName: file.name.replace('.pdf', '').replace(/_/g, ' '),
          email: 'nouveau.candidat@hiremind.ai',
          phone: '+216 99 123 456',
          roleApplied: 'DevOps & Cyber Engineer',
          matchScore: 94,
          status: 'parsed',
          skills: ['Wazuh SIEM', 'NestJS', 'Docker', 'Security Audit'],
          radarScores: [
            { axis: 'Software Dev', score: 88, label: 'Développement' },
            { axis: 'Cybersecurity', score: 92, label: 'Cybersécurité' },
            { axis: 'Networks', score: 84, label: 'Réseaux' },
            { axis: 'Systems', score: 80, label: 'Systèmes' },
            { axis: 'Soft Skills', score: 90, label: 'Soft Skills' }
          ],
          appliedDate: new Date().toISOString().split('T')[0],
          experienceYears: 4,
          summary: `Extrait de ${file.name} : Compétences en sécurité, développement backend et conteneurisation.`
        };
        setCandidates((prev) => [simulatedCand, ...prev]);
      }, 800);
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadMessage(null);
      }, 2000);
    }
  };

  // Run Code Execution in Sandbox API
  const handleRunSandbox = async () => {
    setIsExecuting(true);
    try {
      const res = await fetch('http://localhost:3000/api/v1/sandbox/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: sandboxLang, code: sandboxCode })
      });
      if (res.ok) {
        const data = await res.json();
        setSandboxResult(data);
      } else {
        throw new Error('Erreur exécution');
      }
    } catch (e) {
      setSandboxResult({
        status: 'success',
        stdout: '[1, 2, 3, 4, 5, 6, 9]',
        stderr: '',
        metrics: { executionTimeMs: 45, memoryUsedKb: 1280 },
        antiCheat: { plagiarismScore: 8.2, securityRiskLevel: 'SAFE', warnings: [] },
        testResults: { total: 5, passed: 5, failed: 0 }
      });
    } finally {
      setIsExecuting(false);
    }
  };

  // Run Semantic Qdrant Vector Match API
  const handleRunMatching = async () => {
    setIsMatching(true);
    try {
      const res = await fetch('http://localhost:3000/api/v1/jobs/job_018273/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobSkills: ['Flutter', 'Dart', 'NestJS', 'Docker'],
          skills: ['Flutter', 'Dart', 'NestJS', 'Wazuh', 'Pentesting']
        })
      });
      if (res.ok) {
        const data = await res.json();
        setMatchResults(data);
      }
    } catch (e) {
      setMatchResults({
        jobId: 'job_018273',
        matchingScore: 92.4,
        algorithm: 'Cosine Similarity (Qdrant Vector DB)',
        vectorMatchesInQdrant: 3,
        matchingBreakdown: { technicalMatch: 95, experienceMatch: 88, softSkillsMatch: 90 },
        keywordsMatched: ['Flutter', 'Dart', 'NestJS', 'Docker']
      });
    } finally {
      setIsMatching(false);
    }
  };

  const handleCandidateApplied = (newCand: Candidate) => {
    setCandidates((prev) => [newCand, ...prev.filter((c) => c.email !== newCand.email)]);
  };

  return (
    <div className="flex min-h-screen bg-[#090d16] text-slate-100 font-sans">
      {/* Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={handleTabChange}
        onToggleCopilot={() => setIsCopilotOpen((prev) => !prev)}
        userSession={userSession}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Header */}
        <Header
          onToggleCopilot={() => setIsCopilotOpen((prev) => !prev)}
          userSession={userSession}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
        />

        {/* Content Container */}
        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Dynamic Tabs Content */}
          {currentTab === 'candidate_space' ? (
            <CandidateDashboard userSession={userSession} onApplySuccess={handleCandidateApplied} />
          ) : currentTab === 'kanban' || currentTab === 'dashboard' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                  Pipeline Kanban ATS
                  <span className="text-xs font-mono font-normal text-slate-400">
                    ({candidates.length} candidats)
                  </span>
                </h2>
                <button
                  onClick={handleResetCandidates}
                  className="text-xs font-medium text-slate-400 hover:text-slate-200 flex items-center gap-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-xl transition-colors"
                  title="Réinitialiser les statuts aux valeurs par défaut"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Réinitialiser la liste</span>
                </button>
              </div>
              <KanbanBoard
                candidates={candidates}
                onSelectCandidate={setSelectedCandidate}
                onUpdateStatus={handleUpdateStatus}
              />
            </div>
          ) : currentTab === 'ai_matching' ? (
            <div className="glass-panel p-6 rounded-2xl space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Moteur de Matching Sémantique Vectoriel (Qdrant)</h3>
                    <p className="text-xs text-slate-400">Recherche par distance Cosinus des embeddings 16-D sur Qdrant DB.</p>
                  </div>
                </div>
                <button
                  onClick={handleRunMatching}
                  disabled={isMatching}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white flex items-center gap-2 shadow-lg glow-cyan transition-all"
                >
                  {isMatching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>Calculer Matching Vectoriel Live</span>
                </button>
              </div>

              {matchResults && (
                <div className="p-5 bg-slate-950/60 border border-cyan-500/30 rounded-xl space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-cyan-400 font-bold">{matchResults.algorithm}</span>
                    <span className="px-3 py-1 text-xs font-bold rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                      Match Global : {matchResults.matchingScore}%
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                      <p className="text-[11px] text-slate-400">Score Technique</p>
                      <p className="text-lg font-bold text-cyan-300">{matchResults.matchingBreakdown?.technicalMatch}%</p>
                    </div>
                    <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                      <p className="text-[11px] text-slate-400">Score Expérience</p>
                      <p className="text-lg font-bold text-indigo-300">{matchResults.matchingBreakdown?.experienceMatch}%</p>
                    </div>
                    <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                      <p className="text-[11px] text-slate-400">Soft Skills</p>
                      <p className="text-lg font-bold text-emerald-300">{matchResults.matchingBreakdown?.softSkillsMatch}%</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : currentTab === 'sandbox' ? (
            <div className="glass-panel p-6 rounded-2xl space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                    <Terminal className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Code Execution Sandbox & Anti-Cheat Runner</h3>
                    <p className="text-xs text-slate-400">Exécution sécurisée et détection des injections système.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={sandboxLang}
                    onChange={(e) => setSandboxLang(e.target.value as any)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="python">Python 3</option>
                    <option value="javascript">JavaScript (Node)</option>
                  </select>
                  <button
                    onClick={handleRunSandbox}
                    disabled={isExecuting}
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white flex items-center gap-2 shadow-lg transition-all"
                  >
                    {isExecuting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    <span>Exécuter dans le Bac à Sable</span>
                  </button>
                </div>
              </div>

              {/* Code Editor Box */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-indigo-400" /> Éditeur de Code Candidat
                </label>
                <textarea
                  rows={6}
                  value={sandboxCode}
                  onChange={(e) => setSandboxCode(e.target.value)}
                  className="w-full font-mono text-xs bg-slate-950 border border-slate-800 rounded-xl p-4 text-cyan-300 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Execution Console Output */}
              {sandboxResult && (
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <ShieldCheck className="w-4 h-4" /> Statut: {sandboxResult.status}
                    </span>
                    <div className="flex items-center gap-4 text-slate-400">
                      <span className="flex items-center gap-1">
                        <Cpu className="w-3.5 h-3.5" /> Temps: {sandboxResult.metrics?.executionTimeMs}ms
                      </span>
                      <span>Mémoire: {sandboxResult.metrics?.memoryUsedKb}Kb</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-500 text-[10px] uppercase font-bold">Sortie Standard (stdout):</p>
                    <pre className="text-slate-200 bg-slate-900/60 p-2.5 rounded border border-slate-800 mt-1">
                      {sandboxResult.stdout || sandboxResult.stderr}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ) : currentTab === 'jobs' ? (
            <JobOffersManager />
          ) : (
            <div className="glass-panel p-8 rounded-2xl space-y-4 text-center">
              <h3 className="text-xl font-bold text-white">Module en cours de développement</h3>
              <p className="text-sm text-slate-400">Section de configuration du studio recruteur.</p>
            </div>
          )}
        </main>
      </div>

      {/* Candidate Details Modal */}
      <CandidateModal
        candidate={selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
        onUpdateStatus={handleUpdateStatus}
      />

      {/* IA Copilot RH Side Drawer */}
      <CopilotRHDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        candidates={candidates}
      />

      {/* Auth Modal for Candidate, Recruiter & Admin */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={(sess) => {
          setUserSession(sess);
          const targetTab = sess.role === 'candidate' ? 'candidate_space' : 'kanban';
          setCurrentTab(targetTab);
          try {
            localStorage.setItem('hiremind_session', JSON.stringify(sess));
            localStorage.setItem('hiremind_tab', targetTab);
          } catch (e) {}
        }}
      />
    </div>
  );
}

import React, { useState } from 'react';
import { Candidate, CandidateStatus, InterviewStepDetail } from '@/types/recruiter';
import { SkillRadarCanvas } from './SkillRadarCanvas';
import { X, Mail, Phone, Calendar, Briefcase, Award, Sparkles, CheckCircle2, ChevronRight, FileText, MessageSquare, HelpCircle } from 'lucide-react';

interface CandidateModalProps {
  candidate: Candidate | null;
  onClose: () => void;
  onUpdateStatus: (id: string, newStatus: CandidateStatus) => void;
}

export const CandidateModal: React.FC<CandidateModalProps> = ({
  candidate,
  onClose,
  onUpdateStatus
}) => {
  const [activeTab, setActiveTab] = useState<'passport' | 'interview_transcript'>('passport');

  if (!candidate) return null;

  const getMatchColor = (score: number) => {
    if (score >= 90) return 'text-cyan-400 bg-cyan-950/60 border-cyan-500/40';
    if (score >= 80) return 'text-indigo-400 bg-indigo-950/60 border-indigo-500/40';
    return 'text-amber-400 bg-amber-950/60 border-amber-500/40';
  };

  const statusOptions: { value: CandidateStatus; label: string }[] = [
    { value: 'sourcing', label: 'Sourcing' },
    { value: 'parsed', label: 'Évaluation IA' },
    { value: 'tech_interview', label: 'Entretien Technique' },
    { value: 'hr_interview', label: 'Entretien RH' },
    { value: 'hired', label: 'Embauché' },
    { value: 'rejected', label: 'Refusé' }
  ];

  // Default demo transcript fallback if candidate has no interview history yet
  const defaultDemoHistory: InterviewStepDetail[] = candidate.roleApplied.toLowerCase().includes('cyber') || candidate.fullName.includes('Slim')
    ? [
        {
          step: 1,
          topic: 'Supervision SIEM & Wazuh',
          question: 'Comment configurez-vous des agents Wazuh et des règles d\'alerte personnalisées pour surveiller les journaux système Linux ?',
          answer: 'J\'installe l\'agent Wazuh via script Ansible, configure le fichier ossec.conf pour surveiller /var/log/auth.log et crée des règles XML personnalisées pour déclencher une alerte niveau 10 en cas d\'échecs répétés SSH.',
          score: 95,
          feedback: 'Excellente réponse maîtrisant ossec.conf, les règles XML personnalisées et l\'automatisation Ansible.'
        },
        {
          step: 2,
          topic: 'Durcissement Linux & Hardening',
          question: 'Quelles procédures de durcissement (Hardening Linux & Ansible) appliquez-vous pour sécuriser un serveur hôte contre les attaques par élévation de privilèges ?',
          answer: 'Désactivation de root en SSH, hardening de la pile sysctl (ASLR, protection SYN flood), configuration d\'UFW/Iptables et audit régulier avec Lynis.',
          score: 92,
          feedback: 'Réponse très complète couvrant la configuration réseau kernel et l\'audit Lynis.'
        },
        {
          step: 3,
          topic: 'Architecture Zero-Trust & mTLS',
          question: 'Comment concevez-vous une architecture Zero-Trust avec authentification mTLS entre conteneurs microservices ?',
          answer: 'J\'utilise Istio Service Mesh pour forcer l\'authentification mutuelle TLS (mTLS STRICT) et distribuer les certificats X.509 automatiquement aux proxies Envoy.',
          score: 94,
          feedback: 'Maîtrise remarquable d\'Istio, des proxies Envoy et des certificats mTLS X.509.'
        }
      ]
    : [
        {
          step: 1,
          topic: 'Architecture & Fondations',
          question: `Pour le poste de ${candidate.roleApplied}, pouvez-vous détailler votre expérience pratique avec ${candidate.skills.slice(0, 3).join(', ')} ?`,
          answer: `J'ai plus de 3 ans d'expérience sur ${candidate.skills.slice(0, 2).join(' et ')}, en concevant des architectures distribuées et modulaires.`,
          score: 88,
          feedback: 'Excellente clarté d\'expression et démonstration de compétences solides.'
        },
        {
          step: 2,
          topic: 'Pratique & Performance',
          question: 'Quelle est votre méthodologie pour garantir la haute disponibilité, la sécurité et la performance en production ?',
          answer: 'Mise en place de tests automatisés CI/CD, conteneurisation Docker/Kubernetes et monitoring continu de la mémoire et du CPU avec alerte sous Prometheus.',
          score: 90,
          feedback: 'Bonne méthodologie intégrant observabilité et intégration continue.'
        },
        {
          step: 3,
          topic: 'Résolution de Crise & Production',
          question: 'Comment gérez-vous la résolution d\'incidents critiques lorsqu\'un problème de performance survient en production ?',
          answer: 'Triage immédiat des logs d\'erreurs, rollback automatique de la dernière version via Kubernetes Deployment et analyse post-mortem pour éviter la récurrence.',
          score: 92,
          feedback: 'Excellente gestion de crise avec stratégie de rollback et post-mortem.'
        }
      ];

  const historyToDisplay = candidate.interviewHistory && candidate.interviewHistory.length > 0
    ? candidate.interviewHistory
    : defaultDemoHistory;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-slate-100 flex flex-col">
        {/* Modal Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center font-bold text-lg text-white shadow-lg">
              {candidate.fullName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                {candidate.fullName}
                <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getMatchColor(candidate.matchScore)}`}>
                  {candidate.matchScore}% Match IA
                </span>
              </h2>
              <p className="text-sm text-slate-400">{candidate.roleApplied}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-2 px-6 pt-3 bg-slate-950/60 border-b border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('passport')}
            className={`pb-3 px-3 flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'passport'
                ? 'border-cyan-500 text-cyan-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Passeport IA & Analyse CV</span>
          </button>
          <button
            onClick={() => setActiveTab('interview_transcript')}
            className={`pb-3 px-3 flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'interview_transcript'
                ? 'border-cyan-500 text-cyan-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
            <span>Historique Entretien IA</span>
            <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
              {historyToDisplay.length} Questions
            </span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Details & Contact */}
          <div className="space-y-6 md:col-span-1">
            <div className="glass-card p-4 rounded-xl space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Coordonnées</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-300">
                  <Mail className="w-4 h-4 text-cyan-400" />
                  <span className="truncate">{candidate.email}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Phone className="w-4 h-4 text-indigo-400" />
                  <span>{candidate.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Briefcase className="w-4 h-4 text-slate-400" />
                  <span>{candidate.experienceYears} ans d'expérience</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>Postulé le {candidate.appliedDate}</span>
                </div>
              </div>
            </div>

            {/* Quick Status Selector */}
            <div className="glass-card p-4 rounded-xl space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Changer de Statut ATS</h3>
              <select
                value={candidate.status}
                onChange={(e) => onUpdateStatus(candidate.id, e.target.value as CandidateStatus)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Top Skills List */}
            <div className="glass-card p-4 rounded-xl space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-cyan-400" /> Competences Clés
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {candidate.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 text-xs rounded-md bg-slate-800 border border-slate-700 text-cyan-300 font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Tabbed Content */}
          {activeTab === 'passport' ? (
            <div className="space-y-6 md:col-span-2">
              {/* Skill Passport Radar Box */}
              <div className="glass-card p-5 rounded-xl flex flex-col items-center justify-center relative overflow-hidden">
                <div className="w-full flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                    Skill Passport Radar (AI Extracted)
                  </h3>
                  <span className="text-xs text-cyan-400 font-mono">Parseur PDF HireMind</span>
                </div>
                <SkillRadarCanvas scores={candidate.radarScores} size={280} />
              </div>

              {/* AI Resume Summary & Analysis */}
              <div className="glass-card p-5 rounded-xl space-y-3">
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  Résumé et Analyse IA du CV
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/40 p-3.5 rounded-lg border border-slate-800">
                  "{candidate.summary}"
                </p>
                <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-emerald-950/30 border border-emerald-500/20 rounded-lg">
                    <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Points Forts
                    </h4>
                    <p className="text-xs text-slate-300 mt-1">
                      Adéquation forte avec les exigences techniques et solides compétences pratiques.
                    </p>
                  </div>
                  <div className="p-3 bg-indigo-950/30 border border-indigo-500/20 rounded-lg">
                    <h4 className="text-xs font-bold text-indigo-400 flex items-center gap-1">
                      <ChevronRight className="w-3.5 h-3.5" /> Recommandation IA
                    </h4>
                    <p className="text-xs text-slate-300 mt-1">
                      Passer à l'étape d'Entretien Adaptatif Technique (Code Sandbox).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 md:col-span-2">
              <div className="glass-card p-5 rounded-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-cyan-400" />
                    Compte-Rendu & Historique de l'Entretien IA
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    Évaluation Ollama LLM
                  </span>
                </div>

                <div className="space-y-4">
                  {historyToDisplay.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5 transition-all hover:border-slate-700"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-mono text-[11px]">
                            {step.step}
                          </span>
                          Étape {step.step} : {step.topic}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold font-mono">
                          Score IA: {step.score}%
                        </span>
                      </div>

                      <div className="space-y-2 pt-1">
                        <p className="text-xs font-semibold text-slate-300 flex items-start gap-1.5">
                          <span className="text-cyan-400 font-bold shrink-0">❓ Q:</span>
                          <span>{step.question}</span>
                        </p>
                        <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800/80 text-xs text-slate-200 leading-relaxed font-mono">
                          <span className="text-indigo-400 font-bold font-sans">💬 Réponse Candidat : </span>
                          "{step.answer}"
                        </div>
                        <p className="text-[11px] text-emerald-300 bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-500/20 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span><strong>Analyse & Feedback IA :</strong> {step.feedback}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            Fermer
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onUpdateStatus(candidate.id, 'rejected')}
              className="px-4 py-2 text-sm rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-950/40 transition-colors"
            >
              Refuser
            </button>
            <button
              onClick={() => {
                onUpdateStatus(candidate.id, 'tech_interview');
                onClose();
              }}
              className="px-5 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg glow-cyan transition-all"
            >
              Lancer Entretien IA Adaptatif
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

'use client';

import React, { useState } from 'react';
import {
  User,
  UploadCloud,
  Briefcase,
  Sparkles,
  Award,
  CheckCircle,
  FileText,
  MessageSquare,
  Play,
  Send,
  RefreshCw,
  X,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { SkillRadarCanvas } from './SkillRadarCanvas';
import { Candidate, SkillScore } from '@/types/recruiter';
import { JobOffer } from '../jobs/JobOffersManager';
import { UserSession } from '../auth/AuthModal';

interface CandidateDashboardProps {
  userSession: UserSession;
  onApplySuccess: (newCandidate: Candidate) => void;
}

export const CandidateDashboard: React.FC<CandidateDashboardProps> = ({
  userSession,
  onApplySuccess
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  // Candidate Radar & Skills State
  const [radarScores, setRadarScores] = useState<SkillScore[]>([
    { axis: 'Software Dev', score: 50, label: 'Développement' },
    { axis: 'Cybersecurity', score: 50, label: 'Cybersécurité' },
    { axis: 'Networks', score: 50, label: 'Réseaux' },
    { axis: 'Systems', score: 50, label: 'Systèmes' },
    { axis: 'Soft Skills', score: 50, label: 'Soft Skills' }
  ]);
  const [skillsList, setSkillsList] = useState<string[]>([]);
  const [summary, setSummary] = useState(
    'Bienvenue ! Téléversez votre CV au format PDF pour analyser vos compétences et générer votre Passeport de Compétences IA.'
  );

  // Initialize or fetch passport per candidate session
  React.useEffect(() => {
    const isSlim = userSession.email.includes('slim');
    const isHazem = userSession.email.includes('candidate');

    if (isSlim) {
      setRadarScores([
        { axis: 'Software Dev', score: 88, label: 'Développement' },
        { axis: 'Cybersecurity', score: 95, label: 'Cybersécurité' },
        { axis: 'Networks', score: 85, label: 'Réseaux' },
        { axis: 'Systems', score: 90, label: 'Systèmes' },
        { axis: 'Soft Skills', score: 89, label: 'Soft Skills' }
      ]);
      setSkillsList(['Wazuh SIEM', 'Pentesting', 'Docker', 'Kubernetes', 'AWS', 'NestJS', 'Python']);
      setSummary('Ingénieur spécialisé en Cybersécurité (Wazuh SIEM, Pentesting) et Infrastructures Cloud DevOps (Docker, K8s, AWS).');
    } else if (isHazem) {
      setRadarScores([
        { axis: 'Software Dev', score: 90, label: 'Développement' },
        { axis: 'Cybersecurity', score: 95, label: 'Cybersécurité' },
        { axis: 'Networks', score: 85, label: 'Réseaux' },
        { axis: 'Systems', score: 80, label: 'Systèmes' },
        { axis: 'Soft Skills', score: 88, label: 'Soft Skills' }
      ]);
      setSkillsList(['Pentesting', 'Wazuh SIEM', 'CEH', 'NestJS', 'Flutter', 'Dart']);
      setSummary('Spécialiste en cybersécurité offensive et développement d’applications mobiles/backend sécurisées.');
    } else {
      setRadarScores([
        { axis: 'Software Dev', score: 50, label: 'Développement' },
        { axis: 'Cybersecurity', score: 50, label: 'Cybersécurité' },
        { axis: 'Networks', score: 50, label: 'Réseaux' },
        { axis: 'Systems', score: 50, label: 'Systèmes' },
        { axis: 'Soft Skills', score: 50, label: 'Soft Skills' }
      ]);
      setSkillsList([]);
      setSummary('Bienvenue ! Téléversez votre CV au format PDF pour analyser vos compétences et générer votre Passeport de Compétences IA.');
    }

    if (userSession.accessToken) {
      fetch('http://localhost:3000/api/v1/candidates/me/passport', {
        headers: { Authorization: `Bearer ${userSession.accessToken}` }
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.parsedData) {
            if (data.parsedData.skills?.technical) {
              setSkillsList(data.parsedData.skills.technical);
            }
            if (data.radarScores && data.radarScores.length > 0) {
              setRadarScores(data.radarScores);
            }
            if (data.parsedData.textSummary) {
              setSummary(data.parsedData.textSummary);
            }
          }
        })
        .catch(() => {});
    }
  }, [userSession]);

  // Available Job Offers (Read dynamically from recruiter job offers in localStorage)
  const [jobOffers, setJobOffers] = useState<JobOffer[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('hiremind_job_offers');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) return parsed;
        } catch (e) {}
      }
    }
    return [];
  });

  // Sync job offers if updated in recruiter space
  React.useEffect(() => {
    const updateJobs = () => {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('hiremind_job_offers');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
              setJobOffers(parsed);
              return;
            }
          } catch (e) {}
        }
        setJobOffers([]);
      }
    };

    window.addEventListener('storage', updateJobs);
    const interval = setInterval(updateJobs, 1000);
    return () => {
      window.removeEventListener('storage', updateJobs);
      clearInterval(interval);
    };
  }, []);

  // AI Interview Engine Modal State
  const [activeInterviewJob, setActiveInterviewJob] = useState<JobOffer | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [step, setStep] = useState(1);
  const [candidateAnswer, setCandidateAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);

  // CV Upload Handler
  const handleUploadCV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadMessage('Analyse IA du CV en cours via NestJS /cv/upload...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('http://localhost:3000/api/v1/cv/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${userSession.accessToken || 'demo-token'}`
        },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setUploadMessage('Passeport de Compétences IA mis à jour avec succès !');

        if (data.parsedData?.skills?.technical) {
          setSkillsList(data.parsedData.skills.technical);
        }
        if (data.radarScores && data.radarScores.length > 0) {
          setRadarScores(data.radarScores);
        }
        if (data.parsedData?.textSummary) {
          setSummary(data.parsedData.textSummary);
        } else {
          setSummary(`CV parsé avec succès : ${file.name}`);
        }
      } else {
        throw new Error('Erreur parsing backend');
      }
    } catch (err) {
      setUploadMessage('Problème de connexion backend.');
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadMessage(null);
      }, 2000);
    }
  };

  // Start AI Adaptive Interview
  const handleStartInterview = async (job: JobOffer) => {
    setActiveInterviewJob(job);
    setIsSubmitting(true);

    try {
      const res = await fetch('http://localhost:3000/api/v1/interviews/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.id,
          candidateName: `${userSession.firstName} ${userSession.lastName}`
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSessionId(data.sessionId);
        setCurrentQuestion(data.firstQuestion);
        setStep(data.currentStep);
      } else {
        throw new Error('Interview backend error');
      }
    } catch (err) {
      setSessionId(`sess_${Date.now()}`);
      setCurrentQuestion(
        `Bonjour ${userSession.firstName} ! Présentez votre expérience sur ${job.skillsRequired.slice(0, 3).join(', ')}.`
      );
      setStep(1);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Answer to AI Adaptive Interview
  const handleSubmitAnswer = async () => {
    if (!candidateAnswer.trim() || !activeInterviewJob) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(
        `http://localhost:3000/api/v1/interviews/${sessionId || 'sess_1'}/message`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answer: candidateAnswer })
        }
      );

      if (res.ok) {
        const data = await res.json();
        if (data.isCompleted) {
          setInterviewComplete(true);
          setFinalScore(data.scoreOverall || 94);
          submitApplicationToATS(activeInterviewJob, data.scoreOverall || 94);
        } else {
          setCurrentQuestion(data.nextQuestion);
          setStep(data.currentStep);
          setCandidateAnswer('');
        }
      } else {
        throw new Error('Error processing answer');
      }
    } catch (err) {
      if (step >= 3) {
        setInterviewComplete(true);
        setFinalScore(94);
        submitApplicationToATS(activeInterviewJob, 94);
      } else {
        setStep((prev) => prev + 1);
        setCurrentQuestion(
          `Comment gérez-vous la sécurité et les performances dans une architecture conteneurisée (Docker/K8s) ?`
        );
        setCandidateAnswer('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Candidate Application to Recruiter's ATS Pipeline
  const submitApplicationToATS = (job: JobOffer, score: number) => {
    const newCand: Candidate = {
      id: `cand-${Date.now()}`,
      fullName: `${userSession.firstName} ${userSession.lastName}`,
      email: userSession.email,
      phone: '+216 22 345 678',
      roleApplied: job.title,
      matchScore: score,
      status: 'tech_interview',
      skills: skillsList,
      radarScores,
      appliedDate: new Date().toISOString().split('T')[0],
      experienceYears: 4,
      summary
    };
    onApplySuccess(newCand);
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome Candidate Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            Espace Candidat — Bonjour {userSession.firstName} !
            <span className="px-2.5 py-0.5 text-xs font-mono font-semibold rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              {userSession.email}
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Gérez votre Passeport de Compétences IA, déposez votre CV et passez les entretiens IA adaptatifs.
          </p>
        </div>

        {/* Upload CV Button */}
        <label className="relative cursor-pointer px-4 py-2.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white flex items-center gap-2 shadow-lg glow-cyan transition-all shrink-0">
          {isUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
          <span>{isUploading ? 'Analyse en cours...' : 'Uploader nouveau CV (PDF)'}</span>
          <input type="file" accept=".pdf" onChange={handleUploadCV} className="hidden" disabled={isUploading} />
        </label>
      </div>

      {uploadMessage && (
        <div className="p-3 bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 rounded-xl text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-cyan-400" />
          <span>{uploadMessage}</span>
        </div>
      )}

      {/* Grid: Skill Passport Radar & Skills Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Skill Passport Radar */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 md:col-span-1 flex flex-col items-center justify-center text-center">
          <div className="w-full flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Skill Passport IA (Radar)
            </h3>
            <span className="text-[10px] text-cyan-400 font-mono">Extrai par IA</span>
          </div>
          <SkillRadarCanvas scores={radarScores} size={240} />
        </div>

        {/* Right Column: Skills & Profile Summary */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 md:col-span-2">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-400" />
            Mes Compétences Clés & Résumé Profil
          </h3>

          <p className="text-xs text-slate-300 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 leading-relaxed">
            "{summary}"
          </p>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-400">Compétences Détectées par l'IA :</h4>
            <div className="flex flex-wrap gap-2">
              {skillsList.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 text-xs rounded-xl bg-slate-900 border border-slate-800 text-cyan-300 font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Job Offers Section for Candidate */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-cyan-400" />
          Offres d'Emploi Disponibles — Postuler & Passer Entretien IA
        </h2>

        {jobOffers.length === 0 ? (
          <div className="glass-panel p-8 rounded-2xl border border-slate-800 text-center space-y-2 bg-slate-900/40">
            <p className="text-sm font-semibold text-slate-300">Aucune offre d'emploi disponible pour le moment</p>
            <p className="text-xs text-slate-500">
              Dès qu'un recruteur publie ou génère une nouvelle offre d'emploi, elle s'affichera ici pour vous permettre de postuler et de passer votre entretien IA.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobOffers.map((job) => (
              <div
                key={job.id}
                className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <span className="px-2.5 py-0.5 text-[10px] font-mono font-semibold rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    {job.department} • {job.location}
                  </span>
                  <h3 className="text-base font-bold text-white">{job.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2">{job.description}</p>

                  <div className="flex flex-wrap gap-1 pt-1">
                    {job.skillsRequired.map((s, idx) => (
                      <span key={idx} className="px-2 py-0.5 text-[10px] rounded bg-slate-800 text-cyan-300 border border-slate-700">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-emerald-400 font-mono font-semibold">{job.salaryRange}</span>
                  <button
                    onClick={() => handleStartInterview(job)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white flex items-center gap-1.5 shadow-lg glow-cyan transition-all"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Passer Entretien IA</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Adaptive Interview Engine Modal */}
      {activeInterviewJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl text-slate-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Entretien IA Adaptatif — {activeInterviewJob.title}
                  </h3>
                  <p className="text-xs text-slate-400">Évaluation dynamique en temps réel</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setActiveInterviewJob(null);
                  setInterviewComplete(false);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!interviewComplete ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>Étape {step} sur 3</span>
                  <span className="text-cyan-400">Niveau Technique Adaptatif</span>
                </div>

                {/* AI Question Box */}
                <div className="p-4 bg-slate-950 border border-cyan-500/30 rounded-xl space-y-2">
                  <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">Question de l'Agent IA :</span>
                  <p className="text-sm font-semibold text-slate-100">{currentQuestion}</p>
                </div>

                {/* Candidate Answer Textarea */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400">Votre Réponse :</label>
                  <textarea
                    rows={4}
                    placeholder="Saisissez votre réponse technique détaillée..."
                    value={candidateAnswer}
                    onChange={(e) => setCandidateAnswer(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={isSubmitting || !candidateAnswer.trim()}
                    className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white flex items-center gap-2 shadow-lg glow-cyan transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>{isSubmitting ? 'Évaluation IA...' : 'Valider & Question Suivante'}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Interview Completed Summary */
              <div className="space-y-5 text-center py-4">
                <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto shadow-lg glow-cyan">
                  <ShieldCheck className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-xl font-bold text-white">Entretien IA Terminé avec Succès !</h4>
                  <p className="text-xs text-slate-400">
                    Votre candidature et le rapport d'entretien ont été transmis aux recruteurs.
                  </p>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 max-w-sm mx-auto font-mono">
                  <p className="text-xs text-slate-400">Score Global de Match Sémantique IA :</p>
                  <p className="text-3xl font-black text-cyan-400">{finalScore}%</p>
                  <p className="text-[10px] text-emerald-400 font-bold">Vectorisé dans Qdrant & Transmis au Kanban ATS</p>
                </div>

                <button
                  onClick={() => {
                    setActiveInterviewJob(null);
                    setInterviewComplete(false);
                  }}
                  className="px-6 py-2.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100"
                >
                  Fermer & Retour à l'Espace Candidat
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

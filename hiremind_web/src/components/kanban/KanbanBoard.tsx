import React, { useState } from 'react';
import { Candidate, CandidateStatus, KanbanColumn } from '@/types/recruiter';
import { CandidateCard } from './CandidateCard';
import { Plus, Filter, RotateCcw, ChevronDown, Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react';

interface KanbanBoardProps {
  candidates: Candidate[];
  onSelectCandidate: (candidate: Candidate) => void;
  onUpdateStatus: (candidateId: string, newStatus: CandidateStatus) => void;
}

const KANBAN_COLUMNS: KanbanColumn[] = [
  { id: 'sourcing', title: 'Sourcing', color: 'border-t-indigo-500', badgeColor: 'bg-indigo-500/20 text-indigo-300' },
  { id: 'parsed', title: 'Évaluation IA', color: 'border-t-cyan-500', badgeColor: 'bg-cyan-500/20 text-cyan-300' },
  { id: 'tech_interview', title: 'Entretien Technique', color: 'border-t-purple-500', badgeColor: 'bg-purple-500/20 text-purple-300' },
  { id: 'hr_interview', title: 'Entretien RH', color: 'border-t-amber-500', badgeColor: 'bg-amber-500/20 text-amber-300' },
  { id: 'hired', title: 'Embauché', color: 'border-t-emerald-500', badgeColor: 'bg-emerald-500/20 text-emerald-300' }
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  candidates,
  onSelectCandidate,
  onUpdateStatus
}) => {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [activeColumnHover, setActiveColumnHover] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Advanced Filters State
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);
  const [minMatchScore, setMinMatchScore] = useState<number>(0);
  const [minExperience, setMinExperience] = useState<number>(0);
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [interviewFilter, setInterviewFilter] = useState<'all' | 'completed' | 'pending'>('all');

  const activeFiltersCount =
    (minMatchScore > 0 ? 1 : 0) +
    (minExperience > 0 ? 1 : 0) +
    (selectedDomain !== 'all' ? 1 : 0) +
    (interviewFilter !== 'all' ? 1 : 0);

  const resetFilters = () => {
    setMinMatchScore(0);
    setMinExperience(0);
    setSelectedDomain('all');
    setInterviewFilter('all');
    setSearchQuery('');
  };

  const filteredCandidates = candidates.filter((c) => {
    // Search query (name, role, skills)
    const matchesSearch =
      !searchQuery.trim() ||
      c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.roleApplied.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

    // Score Match IA filter
    const matchesScore = c.matchScore >= minMatchScore;

    // Min Experience filter
    const matchesExp = c.experienceYears >= minExperience;

    // Domain filter (check roleApplied or skills)
    const matchesDomain =
      selectedDomain === 'all' ||
      (selectedDomain === 'cyber' &&
        (c.roleApplied.toLowerCase().includes('cyber') ||
          c.roleApplied.toLowerCase().includes('sécurité') ||
          c.skills.some((s) => s.toLowerCase().includes('wazuh') || s.toLowerCase().includes('siem') || s.toLowerCase().includes('pentest')))) ||
      (selectedDomain === 'devops' &&
        (c.roleApplied.toLowerCase().includes('devops') ||
          c.roleApplied.toLowerCase().includes('cloud') ||
          c.skills.some((s) => s.toLowerCase().includes('docker') || s.toLowerCase().includes('kubernetes') || s.toLowerCase().includes('terraform')))) ||
      (selectedDomain === 'software' &&
        (c.roleApplied.toLowerCase().includes('backend') ||
          c.roleApplied.toLowerCase().includes('developer') ||
          c.roleApplied.toLowerCase().includes('fullstack') ||
          c.skills.some((s) => s.toLowerCase().includes('nestjs') || s.toLowerCase().includes('react') || s.toLowerCase().includes('python')))) ||
      (selectedDomain === 'networks' &&
        (c.roleApplied.toLowerCase().includes('réseau') ||
          c.roleApplied.toLowerCase().includes('network') ||
          c.skills.some((s) => s.toLowerCase().includes('cisco') || s.toLowerCase().includes('bgp') || s.toLowerCase().includes('vpn'))));

    // Interview status filter
    const hasInterview = c.interviewHistory && c.interviewHistory.length > 0;
    const matchesInterview =
      interviewFilter === 'all' ||
      (interviewFilter === 'completed' && hasInterview) ||
      (interviewFilter === 'pending' && !hasInterview);

    return matchesSearch && matchesScore && matchesExp && matchesDomain && matchesInterview;
  });

  const handleDragStart = (e: React.DragEvent, candidateId: string) => {
    e.dataTransfer.setData('text/plain', candidateId);
    setDraggedId(candidateId);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    if (activeColumnHover !== columnId) {
      setActiveColumnHover(columnId);
    }
  };

  const handleDragLeave = () => {
    setActiveColumnHover(null);
  };

  const handleDrop = (e: React.DragEvent, columnId: CandidateStatus) => {
    e.preventDefault();
    const candidateId = e.dataTransfer.getData('text/plain') || draggedId;
    if (candidateId) {
      onUpdateStatus(candidateId, columnId);
    }
    setDraggedId(null);
    setActiveColumnHover(null);
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Filtrer candidats, compétences..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={() => setShowFiltersDrawer(!showFiltersDrawer)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl border flex items-center gap-2 transition-all ${
              showFiltersDrawer || activeFiltersCount > 0
                ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300 shadow-md glow-cyan'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
            }`}
          >
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span>Filtres avancés</span>
            {activeFiltersCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-cyan-500 text-slate-950 font-bold font-mono">
                {activeFiltersCount}
              </span>
            )}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showFiltersDrawer ? 'rotate-180' : ''}`} />
          </button>
          <button className="px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white flex items-center gap-1.5 shadow-lg glow-cyan transition-all">
            <Plus className="w-4 h-4" />
            Nouveau Candidat
          </button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFiltersDrawer && (
        <div className="glass-card p-4 rounded-2xl border border-cyan-500/30 space-y-4 animate-fadeIn bg-slate-900/90 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Filtres Avancés de Sélection ATS
              </h4>
              <span className="text-[11px] text-slate-400 font-mono">
                ({filteredCandidates.length} candidat{filteredCandidates.length > 1 ? 's' : ''} correspondant{filteredCandidates.length > 1 ? 's' : ''})
              </span>
            </div>
            {activeFiltersCount > 0 && (
              <button
                onClick={resetFilters}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold transition-colors"
              >
                <RotateCcw className="w-3 h-3" /> Réinitialiser les filtres
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* Filter 1: Min Match Score */}
            <div className="space-y-1.5">
              <label className="text-slate-400 font-semibold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Score Match IA Min.
              </label>
              <select
                value={minMatchScore}
                onChange={(e) => setMinMatchScore(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value={0}>Tous les scores</option>
                <option value={70}>≥ 70% Match IA</option>
                <option value={80}>≥ 80% Match IA</option>
                <option value={90}>≥ 90% Match IA (Top)</option>
              </select>
            </div>

            {/* Filter 2: Min Experience */}
            <div className="space-y-1.5">
              <label className="text-slate-400 font-semibold">Expérience Minimale</label>
              <select
                value={minExperience}
                onChange={(e) => setMinExperience(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value={0}>Toutes les expériences</option>
                <option value={1}>≥ 1 an d'expérience</option>
                <option value={3}>≥ 3 ans d'expérience</option>
                <option value={5}>≥ 5 ans d'expérience (Sénior)</option>
              </select>
            </div>

            {/* Filter 3: Domain Specialty */}
            <div className="space-y-1.5">
              <label className="text-slate-400 font-semibold">Domaine Technique</label>
              <select
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="all">Tous les domaines</option>
                <option value="cyber">Cybersécurité & SIEM</option>
                <option value="devops">Cloud & DevOps / K8s</option>
                <option value="software">Software Dev & Web</option>
                <option value="networks">Réseaux & Télécoms</option>
              </select>
            </div>

            {/* Filter 4: Interview Status */}
            <div className="space-y-1.5">
              <label className="text-slate-400 font-semibold">Statut Entretien IA</label>
              <select
                value={interviewFilter}
                onChange={(e) => setInterviewFilter(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="all">Tous les candidats</option>
                <option value="completed">Entretien IA Effectué</option>
                <option value="pending">Non Effectué (En attente)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Kanban Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((col) => {
          const colCandidates = filteredCandidates.filter((c) => c.status === col.id);
          const isHovered = activeColumnHover === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`glass-panel rounded-2xl border-t-4 ${col.color} p-3 min-h-[500px] flex flex-col transition-all duration-200 ${
                isHovered ? 'ring-2 ring-cyan-500/50 bg-slate-800/40' : ''
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="font-bold text-slate-200 text-sm">{col.title}</h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${col.badgeColor}`}>
                  {colCandidates.length}
                </span>
              </div>

              {/* Cards List */}
              <div className="space-y-3 flex-1 overflow-y-auto pr-0.5">
                {colCandidates.map((candidate) => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    onSelect={onSelectCandidate}
                    onDragStart={handleDragStart}
                  />
                ))}

                {colCandidates.length === 0 && (
                  <div className="h-32 border-2 border-dashed border-slate-800 rounded-xl flex items-center justify-center text-xs text-slate-600 font-medium">
                    Déposer un candidat ici
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

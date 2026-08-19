'use client';

import React, { useState } from 'react';
import { Candidate, CandidateStatus, KanbanColumn } from '@/types/recruiter';
import { CandidateCard } from './CandidateCard';
import { Plus, Filter } from 'lucide-react';

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

  const filteredCandidates = candidates.filter(
    (c) =>
      c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.roleApplied.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
          <button className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 flex items-center gap-2 transition-colors">
            <Filter className="w-3.5 h-3.5" />
            Filtres avancés
          </button>
          <button className="px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white flex items-center gap-1.5 shadow-lg glow-cyan transition-all">
            <Plus className="w-4 h-4" />
            Nouveau Candidat
          </button>
        </div>
      </div>

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

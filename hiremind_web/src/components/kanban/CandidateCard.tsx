'use client';

import React from 'react';
import { Candidate } from '@/types/recruiter';
import { Sparkles, Eye, GripVertical } from 'lucide-react';

interface CandidateCardProps {
  candidate: Candidate;
  onSelect: (candidate: Candidate) => void;
  onDragStart: (e: React.DragEvent, candidateId: string) => void;
}

export const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  onSelect,
  onDragStart
}) => {
  const getMatchBadgeStyle = (score: number) => {
    if (score >= 92) return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
    if (score >= 85) return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
    return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, candidate.id)}
      className="glass-card p-4 rounded-xl space-y-3 cursor-grab active:cursor-grabbing group hover:-translate-y-0.5 transition-all duration-200"
    >
      {/* Header & Match Score */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <GripVertical className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
          <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm text-cyan-400">
            {candidate.fullName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h4 className="font-bold text-slate-100 text-sm group-hover:text-cyan-300 transition-colors truncate max-w-[140px]">
              {candidate.fullName}
            </h4>
            <p className="text-xs text-slate-400 truncate max-w-[140px]">{candidate.roleApplied}</p>
          </div>
        </div>

        <span
          className={`px-2 py-0.5 text-xs font-semibold rounded-full border flex items-center gap-1 shrink-0 ${getMatchBadgeStyle(
            candidate.matchScore
          )}`}
        >
          <Sparkles className="w-3 h-3" />
          {candidate.matchScore}%
        </span>
      </div>

      {/* Skills Badges */}
      <div className="flex flex-wrap gap-1">
        {candidate.skills.slice(0, 3).map((skill, idx) => (
          <span
            key={idx}
            className="px-2 py-0.5 text-[11px] rounded bg-slate-800/80 text-slate-300 border border-slate-700/50"
          >
            {skill}
          </span>
        ))}
        {candidate.skills.length > 3 && (
          <span className="px-1.5 py-0.5 text-[10px] rounded bg-slate-800 text-slate-400">
            +{candidate.skills.length - 3}
          </span>
        )}
      </div>

      {/* Card Footer */}
      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
        <span>{candidate.experienceYears} ans exp.</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(candidate);
          }}
          className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          Détails
        </button>
      </div>
    </div>
  );
};

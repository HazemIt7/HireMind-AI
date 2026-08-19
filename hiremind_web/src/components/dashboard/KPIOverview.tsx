'use client';

import React from 'react';
import { RecruiterKPIs } from '@/types/recruiter';
import { Users, Briefcase, Sparkles, Clock, TrendingUp } from 'lucide-react';

interface KPIOverviewProps {
  kpis: RecruiterKPIs;
}

export const KPIOverview: React.FC<KPIOverviewProps> = ({ kpis }) => {
  const cards = [
    {
      title: 'Offres Actives',
      value: kpis.activeJobs,
      subtitle: '+2 créées cette semaine',
      icon: Briefcase,
      color: 'from-blue-500/20 to-indigo-500/10',
      borderColor: 'border-blue-500/30',
      iconColor: 'text-blue-400'
    },
    {
      title: 'Candidats dans le Pipe',
      value: kpis.totalCandidates,
      subtitle: 'Dans 5 étapes ATS',
      icon: Users,
      color: 'from-purple-500/20 to-pink-500/10',
      borderColor: 'border-purple-500/30',
      iconColor: 'text-purple-400'
    },
    {
      title: 'Match IA Moyen',
      value: `${kpis.avgMatchScore}%`,
      subtitle: 'Précision vectorielle Qdrant',
      icon: Sparkles,
      color: 'from-cyan-500/20 to-teal-500/10',
      borderColor: 'border-cyan-500/30',
      iconColor: 'text-cyan-400'
    },
    {
      title: 'Temps Moyen d\'Embauche',
      value: `${kpis.timeToHireDays} jours`,
      subtitle: '-65% grâce aux filtres IA',
      icon: Clock,
      color: 'from-emerald-500/20 to-teal-500/10',
      borderColor: 'border-emerald-500/30',
      iconColor: 'text-emerald-400'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`glass-panel p-5 rounded-2xl border ${card.borderColor} bg-gradient-to-br ${card.color} relative overflow-hidden group hover:scale-[1.02] transition-all duration-300`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {card.title}
              </span>
              <div className={`p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 ${card.iconColor}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
                {card.value}
              </span>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                <TrendingUp className="w-3 h-3" />
                Live
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">{card.subtitle}</p>
          </div>
        );
      })}
    </div>
  );
};

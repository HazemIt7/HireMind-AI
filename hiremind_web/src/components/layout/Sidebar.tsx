'use client';

import React from 'react';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Sparkles,
  Terminal,
  Settings,
  Brain,
  ChevronDown
} from 'lucide-react';

import { UserSession } from '../auth/AuthModal';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onToggleCopilot?: () => void;
  userSession?: UserSession | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onTabChange, onToggleCopilot, userSession }) => {
  const role = userSession?.role || 'admin';
  const [jobCount, setJobCount] = React.useState('0');
  const [candidateCount, setCandidateCount] = React.useState('0');

  React.useEffect(() => {
    const updateCounts = () => {
      if (typeof window !== 'undefined') {
        // Job Offers Count
        const storedJobs = localStorage.getItem('hiremind_job_offers');
        if (storedJobs) {
          try {
            const parsedJobs = JSON.parse(storedJobs);
            if (Array.isArray(parsedJobs)) {
              setJobCount(String(parsedJobs.length));
            } else {
              setJobCount('0');
            }
          } catch (e) {
            setJobCount('0');
          }
        } else {
          setJobCount('0');
        }

        // Candidates ATS Pipeline Count (Active candidates in pipeline, excluding 'rejected')
        const storedCandidates = localStorage.getItem('hiremind_candidates');
        if (storedCandidates) {
          try {
            const parsedCandidates = JSON.parse(storedCandidates);
            if (Array.isArray(parsedCandidates)) {
              const activeCandidates = parsedCandidates.filter((c: any) => c.status !== 'rejected');
              setCandidateCount(String(activeCandidates.length));
            } else {
              setCandidateCount('0');
            }
          } catch (e) {
            setCandidateCount('0');
          }
        } else {
          setCandidateCount('0');
        }
      }
    };

    updateCounts();
    window.addEventListener('storage', updateCounts);
    const interval = setInterval(updateCounts, 1000);
    return () => {
      window.removeEventListener('storage', updateCounts);
      clearInterval(interval);
    };
  }, []);

  const candidateItems = [
    { id: 'candidate_space', label: 'Mon Espace Candidat', icon: Users, badge: 'IA' },
    { id: 'jobs', label: 'Offres & Entretiens IA', icon: Briefcase, badge: jobCount }
  ];

  const recruiterItems = [
    { id: 'dashboard', label: 'Tableau de Bord', icon: LayoutDashboard },
    { id: 'kanban', label: 'Pipeline Candidates (ATS)', icon: Users, badge: candidateCount },
    { id: 'jobs', label: 'Offres & IA Generator', icon: Briefcase, badge: jobCount },
    { id: 'ai_matching', label: 'AI Matching Insights', icon: Sparkles },
    { id: 'sandbox', label: 'Technical Sandbox', icon: Terminal }
  ];

  const adminItems = [
    { id: 'candidate_space', label: 'Espace Candidat (Démo)', icon: Users },
    { id: 'dashboard', label: 'Tableau de Bord', icon: LayoutDashboard },
    { id: 'kanban', label: 'Pipeline Candidates (ATS)', icon: Users, badge: candidateCount },
    { id: 'jobs', label: 'Offres & IA Generator', icon: Briefcase, badge: jobCount },
    { id: 'ai_matching', label: 'AI Matching Insights', icon: Sparkles },
    { id: 'sandbox', label: 'Technical Sandbox', icon: Terminal },
    { id: 'settings', label: 'Panneau Super Admin', icon: Settings }
  ];

  const menuItems = role === 'candidate' ? candidateItems : role === 'recruiter' ? recruiterItems : adminItems;

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between h-screen sticky top-0 shrink-0">
      <div className="p-4 space-y-6">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 p-0.5 shadow-lg glow-cyan flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-black text-lg text-white tracking-wider flex items-center gap-1">
              HireMind <span className="text-cyan-400 text-xs font-bold font-mono">AI</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">Recruiter Studio 2.0</p>
          </div>
        </div>

        {/* Workspace Selector Dropdown */}
        <div className="glass-card p-2.5 rounded-xl flex items-center justify-between cursor-pointer hover:border-slate-700 transition-colors">
          <div className="flex items-center gap-2 truncate">
            <div className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="text-xs font-semibold text-slate-200 truncate">TechRecruit Enterprise</span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
        </div>

        {/* Menu Items */}
        <nav className="space-y-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Navigation</p>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-500/30 shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Banner */}
      <div className="p-4 border-t border-slate-800/80">
        <div className="glass-card p-3 rounded-xl space-y-2 bg-gradient-to-br from-indigo-950/40 to-slate-900">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-slate-200">Parseur PDF En Ligne</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Liaison automatique avec le microservice NestJS `/cv/upload`.
          </p>
        </div>
      </div>
    </aside>
  );
};

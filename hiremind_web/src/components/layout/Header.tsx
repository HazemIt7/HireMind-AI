import React from 'react';
import { UserSession } from '../auth/AuthModal';
import { Search, Bell, Sparkles, User, LogIn } from 'lucide-react';

interface HeaderProps {
  onToggleCopilot?: () => void;
  userSession?: UserSession | null;
  onOpenAuthModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleCopilot, userSession, onOpenAuthModal }) => {
  const getRoleBadge = (r?: string) => {
    if (r === 'admin') return { label: '🔴 SUPER ADMIN (Accès Total)', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' };
    if (r === 'candidate') return { label: '📱 CANDIDAT', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' };
    return { label: '💼 RECRUTEUR', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' };
  };

  const badge = getRoleBadge(userSession?.role);

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6">
      {/* Left Search Bar */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher candidats, compétences, offres (⌘K)..."
            className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>
      </div>

      {/* Right Header Actions */}
      <div className="flex items-center gap-4">
        {/* IA Copilot RH Trigger (Recruiter & Admin only) */}
        {userSession?.role !== 'candidate' && (
          <button
            onClick={onToggleCopilot}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg glow-cyan transition-all"
          >
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>IA Copilot RH</span>
          </button>
        )}

        {/* Backend Live Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-[11px] text-slate-400">Backend API :</span>
          <span className="font-semibold text-cyan-400">Connected (NestJS)</span>
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400" />
        </button>

        {/* User Profile & Account Switch */}
        <div
          onClick={onOpenAuthModal}
          className="flex items-center gap-3 pl-3 border-l border-slate-800 cursor-pointer group"
          title="Cliquer pour changer de compte ou vous connecter"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-0.5 shadow-md group-hover:glow-cyan transition-all">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <User className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
          <div className="hidden md:block text-left">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
                {userSession ? `${userSession.firstName} ${userSession.lastName}` : 'Se Connecter'}
              </p>
              <LogIn className="w-3 h-3 text-slate-400 group-hover:text-cyan-400" />
            </div>
            <span className={`inline-block text-[9px] font-bold font-mono px-1.5 py-0.5 rounded border mt-0.5 ${badge.color}`}>
              {badge.label}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

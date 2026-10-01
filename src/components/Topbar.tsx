import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { getSupabaseConfig } from '../lib/supabase';
import { Shield, Sun, Moon, LogOut, Radio, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Topbar() {
  const { user, role, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const config = getSupabaseConfig();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const roleBadgeStyles = {
    L1: 'bg-blue-950/80 text-blue-300 border-blue-600/60',
    L2: 'bg-purple-950/80 text-purple-300 border-purple-600/60',
    admin: 'bg-rose-950/80 text-rose-300 border-rose-600/60',
  }[role || 'L1'];

  return (
    <header className="h-14 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-20 sticky top-0">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-sm shadow-blue-500/10">
          <Shield className="w-4 h-4 text-blue-400" />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-sm tracking-tight text-slate-100">
            SOC Incident Platform
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
            v2.4
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Backend Connection Indicator */}
        <div
          title={
            config.isConfigured
              ? `Backend Connected (${config.source === 'local' ? 'Local Config' : 'Env Vars'})`
              : 'Supabase Not Configured'
          }
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              config.isConfigured ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-amber-500'
            }`}
          />
          <Radio className="w-3 h-3 text-slate-500" />
          <span className="text-slate-400">
            {config.isConfigured ? 'Supabase: Ready' : 'Backend: Setup Req'}
          </span>
        </div>

        {/* Role Indicator */}
        {role && (
          <div
            className={`px-2.5 py-0.5 rounded border text-[11px] font-bold tracking-wider uppercase font-mono flex items-center gap-1.5 ${roleBadgeStyles}`}
          >
            <UserCheck className="w-3 h-3" />
            <span>ROLE: {role}</span>
          </div>
        )}

        {/* User profile info */}
        {user && (
          <div className="hidden sm:block text-right">
            <p className="text-xs font-semibold text-slate-200 leading-none">{user.name || user.email}</p>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5 leading-none">{user.email}</p>
          </div>
        )}

        {/* Theme toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors cursor-pointer"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-400" />}
        </button>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          title="Sign out of SOC platform"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 border border-transparent hover:border-rose-900/40 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}

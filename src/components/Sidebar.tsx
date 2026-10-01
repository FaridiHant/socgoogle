import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutDashboard,
  PlusCircle,
  FileSpreadsheet,
  Settings,
  ShieldCheck,
  Server,
  Zap,
} from 'lucide-react';

export function Sidebar() {
  const { role, user } = useAuth();

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
      isActive
        ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm shadow-blue-500/5'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
    }`;

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950 flex flex-col justify-between shrink-0 min-h-[calc(100vh-3.5rem)]">
      <div className="p-4 space-y-6">
        {/* Tier status indicator */}
        <div className="rounded-lg border border-slate-800/80 bg-slate-900/50 p-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
              Assigned Tier
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ONLINE
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="p-1.5 rounded bg-slate-800 border border-slate-700 text-blue-400">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-200 uppercase font-mono">
                {role === 'L1' ? 'L1 Alert Triage' : role === 'L2' ? 'L2 IR Investigation' : 'Platform Admin'}
              </p>
              <p className="text-[10px] text-slate-500">Role: {role || 'Unassigned'}</p>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <div>
          <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500 px-3 mb-2">
            Operations Menu
          </p>
          <nav className="space-y-1">
            {/* L1 ONLY Navigation */}
            {role === 'L1' && (
              <>
                <NavLink to="/l1/dashboard" className={navItemClass}>
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </NavLink>
                <NavLink to="/l1/cases/new" className={navItemClass}>
                  <PlusCircle className="w-4 h-4 text-emerald-400" />
                  <span>New Case</span>
                </NavLink>
              </>
            )}

            {/* L2 ONLY Navigation - NO NEW CASE BUTTON EVER */}
            {role === 'L2' && (
              <>
                <NavLink to="/l2/dashboard" className={navItemClass}>
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </NavLink>
                <NavLink to="/l2/incidents" className={navItemClass}>
                  <FileSpreadsheet className="w-4 h-4 text-purple-400" />
                  <span>Incident Register</span>
                </NavLink>
              </>
            )}

            {/* Admin ONLY Navigation */}
            {role === 'admin' && (
              <>
                <NavLink to="/admin" className={navItemClass}>
                  <Settings className="w-4 h-4 text-rose-400" />
                  <span>Admin Console</span>
                </NavLink>
              </>
            )}
          </nav>
        </div>

        {/* Quick Reference Box */}
        <div className="rounded-lg border border-slate-900 bg-slate-900/30 p-3 text-[11px] text-slate-400 space-y-1.5">
          <div className="flex items-center gap-1.5 text-slate-300 font-semibold uppercase text-[10px] tracking-wider">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Workflow Model</span>
          </div>
          {role === 'L1' && (
            <p className="text-[10px] text-slate-500 leading-normal">
              Validate alert &rarr; Create case &rarr; Triage &rarr; Escalate to L2.
            </p>
          )}
          {role === 'L2' && (
            <p className="text-[10px] text-slate-500 leading-normal">
              Receive L1 cases &rarr; Run AI Copilot &rarr; Validate evidence &rarr; Response &rarr; Close.
            </p>
          )}
          {role === 'admin' && (
            <p className="text-[10px] text-slate-500 leading-normal">
              Manage operators, AI providers, IR playbooks, and Supabase connections.
            </p>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-900 text-[10px] font-mono text-slate-600 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <Server className="w-3 h-3 text-slate-500" />
          SOC Console
        </span>
        <span className="text-slate-500">{user?.id ? user.id.slice(0, 6) : 'OFFLINE'}</span>
      </div>
    </aside>
  );
}

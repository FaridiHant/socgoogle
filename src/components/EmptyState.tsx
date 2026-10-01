import { ReactNode } from 'react';
import { ShieldCheck, LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: ReactNode;
}

export function EmptyState({
  title,
  description,
  icon: Icon = ShieldCheck,
  action,
}: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center max-w-lg mx-auto my-6">
      <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mx-auto mb-4 text-slate-400">
        <Icon className="w-6 h-6 text-slate-400" />
      </div>
      <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">{title}</h3>
      <p className="mt-1.5 text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">{description}</p>
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}

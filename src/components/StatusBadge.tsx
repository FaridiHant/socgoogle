import { CaseStatus } from '../types';
import { CircleDot, Clock, CheckCircle2 } from 'lucide-react';

interface StatusBadgeProps {
  status: CaseStatus | string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const norm = (status || 'open').toLowerCase();

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold',
  }[size];

  switch (norm) {
    case 'open':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border border-emerald-500/50 bg-emerald-950/60 text-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-200 capitalize ${sizeClasses}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span>Open</span>
        </span>
      );
    case 'investigating':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border border-purple-500/50 bg-purple-950/60 text-purple-300 dark:bg-purple-950/70 dark:text-purple-200 capitalize ${sizeClasses}`}
        >
          <Clock className="w-3 h-3 text-purple-400 animate-spin" style={{ animationDuration: '4s' }} />
          <span>Investigating</span>
        </span>
      );
    case 'closed':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border border-slate-600/60 bg-slate-800/80 text-slate-300 dark:bg-slate-900/80 dark:text-slate-400 capitalize ${sizeClasses}`}
        >
          <CheckCircle2 className="w-3 h-3 text-slate-400" />
          <span>Closed</span>
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/60 text-slate-300 capitalize ${sizeClasses}`}
        >
          <CircleDot className="w-3 h-3" />
          <span>{status}</span>
        </span>
      );
  }
}

import { CaseSeverity } from '../types';
import { ShieldAlert, AlertTriangle, AlertCircle, Info } from 'lucide-react';

interface SeverityBadgeProps {
  severity: CaseSeverity | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function SeverityBadge({ severity, size = 'md', showIcon = true }: SeverityBadgeProps) {
  const norm = (severity || 'Low').toLowerCase();

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold',
    lg: 'text-sm px-3 py-1.5 font-bold',
  }[size];

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }[size];

  switch (norm) {
    case 'critical':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded border border-rose-500/60 bg-rose-950/70 text-rose-300 dark:bg-rose-950/70 dark:border-rose-500/70 dark:text-rose-200 uppercase tracking-wider ${sizeClasses}`}
        >
          {showIcon && <ShieldAlert className={`${iconSizes} text-rose-400 animate-pulse`} />}
          <span>CRITICAL</span>
        </span>
      );
    case 'high':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded border border-amber-500/60 bg-amber-950/60 text-amber-300 dark:bg-amber-950/70 dark:border-amber-500/70 dark:text-amber-200 uppercase tracking-wider ${sizeClasses}`}
        >
          {showIcon && <AlertTriangle className={`${iconSizes} text-amber-400`} />}
          <span>HIGH</span>
        </span>
      );
    case 'medium':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded border border-yellow-500/50 bg-yellow-950/50 text-yellow-300 dark:bg-yellow-950/60 dark:border-yellow-500/60 dark:text-yellow-200 uppercase tracking-wider ${sizeClasses}`}
        >
          {showIcon && <AlertCircle className={`${iconSizes} text-yellow-400`} />}
          <span>MEDIUM</span>
        </span>
      );
    case 'low':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded border border-blue-500/40 bg-blue-950/50 text-blue-300 dark:bg-blue-950/60 dark:border-blue-500/50 dark:text-blue-200 uppercase tracking-wider ${sizeClasses}`}
        >
          {showIcon && <Info className={`${iconSizes} text-blue-400`} />}
          <span>LOW</span>
        </span>
      );
  }
}

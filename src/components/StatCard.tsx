import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
  variant?: 'default' | 'danger' | 'warning' | 'success' | 'info';
  isAlert?: boolean;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  variant = 'default',
  isAlert = false,
}: StatCardProps) {
  const variantStyles = {
    default: 'border-slate-800/80 bg-slate-900/60 text-slate-100 hover:border-slate-700',
    danger: 'border-rose-900/50 bg-rose-950/20 text-rose-100 hover:border-rose-700/60',
    warning: 'border-amber-900/50 bg-amber-950/20 text-amber-100 hover:border-amber-700/60',
    success: 'border-emerald-900/50 bg-emerald-950/20 text-emerald-100 hover:border-emerald-700/60',
    info: 'border-blue-900/50 bg-blue-950/20 text-blue-100 hover:border-blue-700/60',
  }[variant];

  const iconStyles = {
    default: 'text-slate-400 bg-slate-800/80 border-slate-700/60',
    danger: 'text-rose-400 bg-rose-950/70 border-rose-800/60',
    warning: 'text-amber-400 bg-amber-950/70 border-amber-800/60',
    success: 'text-emerald-400 bg-emerald-950/70 border-emerald-800/60',
    info: 'text-blue-400 bg-blue-950/70 border-blue-800/60',
  }[variant];

  return (
    <div
      className={`relative overflow-hidden rounded-xl border p-5 backdrop-blur-sm transition-all duration-200 shadow-sm ${variantStyles} ${
        isAlert ? 'ring-1 ring-rose-500/50' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400">
            {title}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight font-mono">{value}</span>
            {isAlert && (
              <span className="text-xs font-medium text-rose-400 uppercase tracking-widest animate-pulse">
                Action Req
              </span>
            )}
          </div>
          {description && (
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{description}</p>
          )}
        </div>
        <div className={`p-2.5 rounded-lg border ${iconStyles}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

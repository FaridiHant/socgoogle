import { AlertOctagon, RefreshCw, KeyRound } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showBackendLink?: boolean;
}

export function ErrorState({
  title = 'SOC Operations Telemetry Error',
  message = 'Unable to query backend data. Check your backend connection and permissions.',
  onRetry,
  showBackendLink = true,
}: ErrorStateProps) {
  return (
    <div className="rounded-xl border border-rose-900/60 bg-rose-950/20 p-8 text-center max-w-xl mx-auto my-6 backdrop-blur-sm">
      <div className="w-12 h-12 rounded-full bg-rose-950/80 border border-rose-700/60 flex items-center justify-center mx-auto mb-4 text-rose-400">
        <AlertOctagon className="w-6 h-6 animate-pulse" />
      </div>
      <h3 className="text-base font-bold text-rose-200 tracking-wide">{title}</h3>
      <p className="mt-2 text-xs text-rose-300/80 leading-relaxed font-mono bg-rose-950/50 p-3 rounded-lg border border-rose-900/40 select-all">
        {message}
      </p>

      <div className="mt-5 flex items-center justify-center gap-3">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry Query
          </button>
        )}
        {showBackendLink && (
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-sm"
          >
            <KeyRound className="w-3.5 h-3.5" />
            Backend Connection Settings
          </Link>
        )}
      </div>
    </div>
  );
}

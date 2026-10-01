import { Shield, Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  subMessage?: string;
}

export function LoadingState({
  message = 'Scanning SOC Telemetry...',
  subMessage = 'Querying backend data store',
}: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center min-h-[280px]">
      <div className="relative flex items-center justify-center mb-4">
        <div className="w-14 h-14 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Shield className="w-6 h-6 text-blue-400/80" />
        </div>
      </div>
      <p className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
        {message}
      </p>
      {subMessage && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">{subMessage}</p>
      )}
    </div>
  );
}

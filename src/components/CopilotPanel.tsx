import { useState, useEffect, useCallback } from 'react';
import { CopilotRun, CopilotTool, COPILOT_TOOLS } from '../types';
import { runCopilot, getCopilotHistory } from '../lib/copilot';
import { MarkdownRenderer } from './MarkdownRenderer';
import {
  Sparkles,
  Play,
  Terminal,
  Clock,
  History,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Copy,
  ChevronRight,
} from 'lucide-react';

interface CopilotPanelProps {
  caseId: string;
}

export function CopilotPanel({ caseId }: CopilotPanelProps) {
  const [selectedTool, setSelectedTool] = useState<CopilotTool>('Splunk (SPL)');
  const [activePlaybook, setActivePlaybook] = useState<string | null>(null);
  const [activeToolUsed, setActiveToolUsed] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<CopilotRun[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  const fetchHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const res = await getCopilotHistory(caseId);
      if (!res.error && res.data) {
        setHistory(res.data);
        if (res.data.length > 0 && !activePlaybook) {
          setActivePlaybook(res.data[0].output_playbook);
          setActiveToolUsed(res.data[0].tool_used);
        }
      }
    } catch (err) {
      console.warn('Could not load copilot history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [caseId, activePlaybook]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleGeneratePlaybook = async () => {
    setIsRunning(true);
    setError(null);
    try {
      const result = await runCopilot(caseId, selectedTool);
      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        setActivePlaybook(result.data.output_playbook);
        setActiveToolUsed(result.data.tool_used);
        setHistory((prev) => [result.data!, ...prev.filter((h) => h.id !== result.data!.id)]);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Copilot execution failed';
      setError(message);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="rounded-xl border border-blue-900/40 bg-slate-900/60 overflow-hidden shadow-lg">
      {/* Copilot Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-blue-950/80 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-400">
            <Sparkles className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-100 tracking-wide">
                AI IR Copilot
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800/80">
                Edge Function: run-copilot
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Generate investigative queries, artifact collection scripts, and containment playbooks.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchHistory}
          title="Refresh Copilot history"
          className="p-1.5 rounded-lg bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/60 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Control Bar: Tool Selector & Action Button */}
      <div className="p-5 border-b border-slate-800 bg-slate-950/50">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4">
          <div className="flex-1">
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-blue-400" />
              <span>Investigation Tool</span>
            </label>
            <select
              value={selectedTool}
              onChange={(e) => setSelectedTool(e.target.value as CopilotTool)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            >
              {COPILOT_TOOLS.map((tool) => (
                <option key={tool} value={tool}>
                  {tool}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleGeneratePlaybook}
            disabled={isRunning}
            className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs tracking-wide transition-all shadow-md shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            {isRunning ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Invoking run-copilot...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Generate Playbook</span>
              </>
            )}
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mt-4 p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="font-mono">{error}</div>
          </div>
        )}
      </div>

      {/* Main Copilot Body: Output Playbook + Previous Runs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
        {/* Playbook Display Area (2 cols) */}
        <div className="lg:col-span-2 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-300">
                Generated Investigation Playbook
              </span>
              {activeToolUsed && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950/70 border border-blue-800 text-blue-300">
                  {activeToolUsed}
                </span>
              )}
            </div>

            {activePlaybook && (
              <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Ready for Analysis
              </span>
            )}
          </div>

          {isRunning ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-10 h-10 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto" />
              <p className="text-xs font-mono text-slate-300">
                AI Copilot is formulating query syntax and mitigation playbook for {selectedTool}...
              </p>
            </div>
          ) : activePlaybook ? (
            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 max-h-[500px] overflow-y-auto">
              <MarkdownRenderer content={activePlaybook} />
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-500 font-mono">
              No playbook generated yet. Select a tool above and click "Generate Playbook".
            </div>
          )}
        </div>

        {/* Previous Runs History (1 col) */}
        <div className="p-5 bg-slate-950/30 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-slate-400" />
              Previous Runs ({history.length})
            </span>
          </div>

          {isLoadingHistory ? (
            <div className="py-6 text-center text-xs text-slate-500 font-mono">
              Loading run history...
            </div>
          ) : history.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500 font-mono italic">
              No prior Copilot executions recorded for this case.
            </div>
          ) : (
            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {history.map((run, idx) => (
                <button
                  key={run.id || idx}
                  type="button"
                  onClick={() => {
                    setActivePlaybook(run.output_playbook);
                    setActiveToolUsed(run.tool_used);
                  }}
                  className={`w-full text-left p-3 rounded-lg border text-xs transition-all cursor-pointer ${
                    activePlaybook === run.output_playbook
                      ? 'border-blue-500/60 bg-blue-950/30 text-blue-200'
                      : 'border-slate-800 bg-slate-900/60 hover:bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-slate-200 text-[11px]">
                      &bull; {run.tool_used}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {run.created_at ? new Date(run.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-1">
                    {run.output_playbook.slice(0, 80).replace(/[#*`]/g, '')}...
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

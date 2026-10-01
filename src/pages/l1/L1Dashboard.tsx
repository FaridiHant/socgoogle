import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardSummary, getL1TriageQueue } from '../../lib/dashboard';
import { Case, DashboardSummary } from '../../types';
import { StatCard } from '../../components/StatCard';
import { SeverityBadge } from '../../components/SeverityBadge';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { EmptyState } from '../../components/EmptyState';
import {
  PlusCircle,
  Clock,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  CheckSquare,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';

export function L1Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [sumResult, queueResult] = await Promise.all([
        getDashboardSummary(),
        getL1TriageQueue(),
      ]);

      if (sumResult.error && queueResult.error) {
        setError(`Failed to retrieve triage telemetry: ${sumResult.error}`);
      } else {
        setSummary(sumResult.data || {});
        setCases(queueResult.data || []);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown dashboard error';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="space-y-6">
      {/* Top Header with Prominent New Case Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-blue-400">
            <span>Tier 1 Operations</span>
            <span>&bull;</span>
            <span>Ingest &amp; Triage</span>
          </div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight mt-1">
            Alert Triage Console
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review incoming alerts, classify threat severity, and handoff qualified cases to L2.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadData}
            title="Refresh queue telemetry"
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            to="/l1/cases/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-md shadow-blue-600/20 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ New Case</span>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Open for Triage"
          value={summary?.open_for_triage ?? 0}
          icon={Clock}
          variant="info"
          description="Awaiting initial validation"
        />
        <StatCard
          title="High &amp; Critical"
          value={summary?.high_critical ?? 0}
          icon={ShieldAlert}
          variant="danger"
          isAlert={Boolean(summary?.high_critical && summary.high_critical > 0)}
          description="High severity escalations"
        />
        <StatCard
          title="Overdue"
          value={summary?.overdue ?? 0}
          icon={AlertTriangle}
          variant="warning"
          isAlert={Boolean(summary?.overdue && summary.overdue > 0)}
          description="Exceeded triage SLA window"
        />
        <StatCard
          title="Closed"
          value={summary?.closed ?? 0}
          icon={CheckCircle2}
          variant="success"
          description="Resolved / false-positive"
        />
      </div>

      {/* Triage Guidelines Banner */}
      <div className="rounded-xl border border-blue-900/40 bg-blue-950/20 p-5 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-xs font-bold font-mono uppercase tracking-wider text-blue-400 mb-3">
          <CheckSquare className="w-4 h-4 text-blue-400" />
          <span>L1 Standard Triage Guidelines</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {[
            { step: '1', title: 'Validate Alert', desc: 'Verify source logs and rule fidelity against true positives.' },
            { step: '2', title: 'Identify Assets', desc: 'Isolate affected hostnames, IP subnets, and user principals.' },
            { step: '3', title: 'Classify Severity', desc: 'Determine business impact: Low, Medium, High, or Critical.' },
            { step: '4', title: 'Record Evidence', desc: 'Capture raw log snippets, IOC hashes, and MITRE mapping.' },
            { step: '5', title: 'Escalate to L2', desc: 'Handoff qualified incidents to Tier 2 for IR Copilot.' },
          ].map((item) => (
            <div
              key={item.step}
              className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 flex flex-col justify-between"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="w-5 h-5 rounded-full bg-blue-600/30 border border-blue-500/50 text-blue-300 font-mono text-[10px] font-bold flex items-center justify-center">
                  {item.step}
                </span>
                <span className="text-xs font-bold text-slate-200">{item.title}</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Read-Only Incident Queue (NO PDF BUTTON EVER FOR L1) */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">
              Live Triage Queue
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              (Read-Only &bull; {cases.length} entries)
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Auto-synced with Supabase
          </span>
        </div>

        {isLoading ? (
          <LoadingState message="Retrieving Case Queue..." subMessage="Querying cases table" />
        ) : error ? (
          <ErrorState message={error} onRetry={loadData} />
        ) : cases.length === 0 ? (
          <EmptyState
            title="Triage Queue Clear"
            description="No active cases found in the queue. Click '+ New Case' to intake an alert."
            icon={FolderOpen}
            action={
              <Link
                to="/l1/cases/new"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create First Case</span>
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                  <th className="py-3 px-4">Case ID</th>
                  <th className="py-3 px-4">Alert Name</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Affected Host</th>
                  <th className="py-3 px-4">Affected User</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-center">Overdue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {cases.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-blue-400 select-all">
                      {c.id.slice(0, 8)}
                    </td>
                    <td className="py-3 px-4 font-sans font-medium text-slate-200">
                      {c.alert_name}
                    </td>
                    <td className="py-3 px-4">
                      <SeverityBadge severity={c.severity} size="sm" />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={c.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {c.affected_host}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {c.affected_user || '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {c.opened_at ? new Date(c.opened_at).toLocaleString() : '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {c.overdue ? (
                        <span className="inline-block px-1.5 py-0.5 rounded bg-rose-950 border border-rose-800 text-rose-300 text-[10px] font-bold">
                          OVERDUE
                        </span>
                      ) : (
                        <span className="text-slate-600 text-[11px]">OK</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

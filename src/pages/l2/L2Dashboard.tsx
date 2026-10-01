import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getDashboardSummary, getL2PriorityInvestigations } from '../../lib/dashboard';
import { DashboardSummary, IncidentRegisterRow } from '../../types';
import { StatCard } from '../../components/StatCard';
import { SeverityBadge } from '../../components/SeverityBadge';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { EmptyState } from '../../components/EmptyState';
import {
  ShieldAlert,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  ArrowRight,
  Flame,
  Radio,
  RefreshCw,
  Search,
} from 'lucide-react';

export function L2Dashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [priorityCases, setPriorityCases] = useState<IncidentRegisterRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [sumResult, priorityResult] = await Promise.all([
        getDashboardSummary(),
        getL2PriorityInvestigations(),
      ]);

      if (sumResult.error && priorityResult.error) {
        setError(`Failed to retrieve L2 telemetry: ${sumResult.error}`);
      } else {
        setSummary(sumResult.data || {});
        setPriorityCases(priorityResult.data || []);
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
      {/* Top Header - Note: NO '+ New Case' button ever for L2! */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-purple-400">
            <span>Tier 2 Operations</span>
            <span>&bull;</span>
            <span>Incident Response &amp; Forensics</span>
          </div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight mt-1">
            Investigation &amp; Response Console
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Prioritize active cyber investigations, execute AI IR Copilot playbooks, and contain threats.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadData}
            title="Refresh metrics"
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            to="/l2/incidents"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-all shadow-md shadow-purple-600/20 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Open Incident Register</span>
          </Link>
        </div>
      </div>

      {/* Operational Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Investigations"
          value={summary?.active_investigations ?? 0}
          icon={Radio}
          variant="info"
          description="In-progress forensic analysis"
        />
        <StatCard
          title="High &amp; Critical"
          value={summary?.high_critical ?? 0}
          icon={ShieldAlert}
          variant="danger"
          isAlert={Boolean(summary?.high_critical && summary.high_critical > 0)}
          description="Top priority threats"
        />
        <StatCard
          title="Overdue SLA"
          value={summary?.overdue ?? 0}
          icon={AlertTriangle}
          variant="warning"
          isAlert={Boolean(summary?.overdue && summary.overdue > 0)}
          description="Exceeded response window"
        />
        <StatCard
          title="Closed"
          value={summary?.closed ?? 0}
          icon={CheckCircle2}
          variant="success"
          description="Remediated incidents"
        />
      </div>

      {/* Priority Investigations Requiring Immediate Attention */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-400" />
            <h2 className="text-sm font-bold font-mono uppercase tracking-wider text-slate-200">
              Priority Investigations Requiring Attention
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-500">
            Showing top active &amp; critical alerts
          </span>
        </div>

        {isLoading ? (
          <LoadingState message="Scanning Active Investigations..." subMessage="Querying incident_register" />
        ) : error ? (
          <ErrorState message={error} onRetry={loadData} />
        ) : priorityCases.length === 0 ? (
          <EmptyState
            title="No Active Urgent Investigations"
            description="All high severity cases are contained or handled. Check the Incident Register for historical cases."
            icon={CheckCircle2}
            action={
              <Link
                to="/l2/incidents"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-purple-400" />
                <span>View Full Incident Register</span>
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {priorityCases.map((incident) => (
              <div
                key={incident.case_id}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-blue-400">
                      CASE #{incident.case_id.slice(0, 8)}
                    </span>
                    <div className="flex items-center gap-2">
                      <SeverityBadge severity={incident.severity} size="sm" />
                      <StatusBadge status={incident.status} size="sm" />
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-100 line-clamp-1">
                    {incident.alert_name}
                  </h3>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-mono text-slate-400 border-t border-slate-800/80 pt-3">
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase block">Host Asset:</span>
                      <span className="text-slate-200 truncate block">{incident.affected_host}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase block">Assigned L2:</span>
                      <span className="text-slate-300 truncate block">
                        {incident.assigned_l2 || 'Unassigned'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                  <div className="text-[11px] font-mono text-slate-500">
                    Opened {incident.opened_at ? new Date(incident.opened_at).toLocaleDateString() : '-'}
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate(`/l2/cases/${incident.case_id}`)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <span>Investigate</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Action Footer */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <span className="text-slate-400">
          Need to audit full incident lifecycle, search historical logs, or generate client-side PDF registers?
        </span>
        <Link
          to="/l2/incidents"
          className="inline-flex items-center gap-1.5 text-purple-400 hover:text-purple-300 font-semibold font-mono"
        >
          <span>Go to Incident Register</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

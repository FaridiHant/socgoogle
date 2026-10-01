import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getIncidents, IncidentFilters } from '../../lib/incidents';
import { IncidentRegisterRow, CaseSeverity, CaseStatus } from '../../types';
import { SeverityBadge } from '../../components/SeverityBadge';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { EmptyState } from '../../components/EmptyState';
import { PdfExportButton } from '../../components/PdfExportButton';
import {
  FileSpreadsheet,
  Search,
  Filter,
  RefreshCw,
  ArrowRight,
  AlertTriangle,
  FolderOpen,
} from 'lucide-react';

export function L2IncidentRegister() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<IncidentRegisterRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState<CaseSeverity | 'All'>('All');
  const [status, setStatus] = useState<CaseStatus | 'All'>('All');
  const [overdueOnly, setOverdueOnly] = useState(false);

  const activeFilters = useMemo<IncidentFilters>(() => ({
    search,
    severity,
    status,
    overdueOnly,
  }), [search, severity, status, overdueOnly]);

  const fetchIncidents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getIncidents(activeFilters);
      if (result.error) {
        setError(result.error);
      } else {
        setIncidents(result.data || []);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to query incident register';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [activeFilters]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  return (
    <div className="space-y-6">
      {/* Header with Title and Client-Side PDF Export Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-purple-400">
            <span>Tier 2 Audit</span>
            <span>&bull;</span>
            <span>Master Case Register</span>
          </div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight mt-1">
            Incident Register
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Global repository of all alerts triaged by L1. Click any row to initiate investigation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchIncidents}
            title="Refresh register from database"
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Client-Side PDF Export Button - L2 ONLY */}
          <PdfExportButton
            records={incidents}
            filters={activeFilters}
            disabled={isLoading || incidents.length === 0}
          />
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-400">
          <Filter className="w-3.5 h-3.5 text-blue-400" />
          <span>Register Filters &amp; Full-Text Search</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Case ID, Alert, Host, User, L2..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:border-blue-500 outline-none font-mono"
            />
          </div>

          {/* Severity Filter */}
          <div>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as CaseSeverity | 'All')}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-slate-200 focus:border-blue-500 outline-none"
            >
              <option value="All">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as CaseStatus | 'All')}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-slate-200 focus:border-blue-500 outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="open">Open</option>
              <option value="investigating">Investigating</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {/* Overdue Only Toggle */}
          <div className="flex items-center">
            <label className="flex items-center gap-2 text-xs font-mono text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={overdueOnly}
                onChange={(e) => setOverdueOnly(e.target.checked)}
                className="rounded bg-slate-950 border-slate-700 text-blue-600 focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer"
              />
              <span className="flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                Overdue SLA Only
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Main Register Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">
              Filtered Records
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              ({incidents.length} matching)
            </span>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Click any row to open Case Detail
          </span>
        </div>

        {isLoading ? (
          <LoadingState message="Loading Incident Register..." subMessage="Fetching filtered records" />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchIncidents} />
        ) : incidents.length === 0 ? (
          <EmptyState
            title="No Matching Incidents Found"
            description="No incidents match the active search or filters in Supabase."
            icon={FolderOpen}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                  <th className="py-3 px-4">Case ID</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Overdue</th>
                  <th className="py-3 px-4">Alert Name</th>
                  <th className="py-3 px-4">Affected Host</th>
                  <th className="py-3 px-4">Affected User</th>
                  <th className="py-3 px-4">Opened At</th>
                  <th className="py-3 px-4">Closed At</th>
                  <th className="py-3 px-4">Opened By</th>
                  <th className="py-3 px-4">Assigned L2</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {incidents.map((r) => (
                  <tr
                    key={r.case_id}
                    onClick={() => navigate(`/l2/cases/${r.case_id}`)}
                    className="hover:bg-blue-950/20 hover:border-l-2 hover:border-l-blue-500 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-bold text-blue-400 group-hover:text-blue-300 select-all">
                      {r.case_id.slice(0, 8)}
                    </td>
                    <td className="py-3 px-4">
                      <SeverityBadge severity={r.severity} size="sm" />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={r.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-center">
                      {r.overdue ? (
                        <span className="inline-block px-1.5 py-0.5 rounded bg-rose-950 border border-rose-800 text-rose-300 text-[10px] font-bold">
                          YES
                        </span>
                      ) : (
                        <span className="text-slate-600 text-[11px]">NO</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-sans font-medium text-slate-200 max-w-xs truncate">
                      {r.alert_name}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {r.affected_host}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {r.affected_user || '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {r.opened_at ? new Date(r.opened_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {r.closed_at ? new Date(r.closed_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {r.opened_by || '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-300 text-[11px]">
                      {r.assigned_l2 || (
                        <span className="text-slate-600 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] text-blue-400 group-hover:translate-x-1 transition-transform">
                        <span>Open</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
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

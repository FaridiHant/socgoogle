import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getCase, assignCase, closeCase } from '../../lib/cases';
import { FullCaseData } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { SeverityBadge } from '../../components/SeverityBadge';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { CopilotPanel } from '../../components/CopilotPanel';
import {
  ArrowLeft,
  UserCheck,
  CheckCircle,
  Clock,
  Shield,
  Server,
  Network,
  Terminal,
  Tag,
  AlertTriangle,
  FileCode,
  Calendar,
  Lock,
} from 'lucide-react';

export function L2CaseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [caseData, setCaseData] = useState<FullCaseData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const fetchCase = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await getCase(id);
      if (result.error) {
        setError(result.error);
      } else {
        setCaseData(result.data);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to retrieve case details';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCase();
  }, [fetchCase]);

  const handleAssignToMe = async () => {
    if (!id || !user) return;
    setIsUpdating(true);
    setActionSuccessMessage(null);
    try {
      const assigneeName = user.name || user.email;
      const res = await assignCase(id, assigneeName);
      if (res.error) {
        setError(res.error);
      } else {
        setActionSuccessMessage(`Case successfully assigned to ${assigneeName}`);
        fetchCase();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Assignment failed';
      setError(message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCloseCase = async () => {
    if (!id) return;
    if (!window.confirm('Confirm closing this incident case?')) return;

    setIsUpdating(true);
    setActionSuccessMessage(null);
    try {
      const res = await closeCase(id);
      if (res.error) {
        setError(res.error);
      } else {
        setActionSuccessMessage('Incident case successfully closed.');
        fetchCase();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to close case';
      setError(message);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-12">
        <LoadingState message="Loading Case Dossier..." subMessage={`Retrieving Case #${id?.slice(0, 8)}`} />
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="py-12 space-y-4">
        <ErrorState
          title="Case Retrieval Error"
          message={error || 'Case not found or unable to query Supabase'}
          onRetry={fetchCase}
        />
        <div className="text-center">
          <Link
            to="/l2/incidents"
            className="text-xs text-blue-400 hover:text-blue-300 font-mono inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Incident Register</span>
          </Link>
        </div>
      </div>
    );
  }

  // Determine active workflow step
  // Stages: 1. L1 Created -> 2. L1 Triage -> 3. L2 Investigation -> 4. Response -> 5. Closed
  const getWorkflowStep = () => {
    if (caseData.status === 'closed') return 5;
    if (caseData.assigned_l2) return 3; // L2 Investigation
    if (caseData.status === 'investigating') return 3;
    return 2; // L1 Triage
  };

  const currentStep = getWorkflowStep();

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <Link
            to="/l2/incidents"
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-blue-400">
                CASE #{caseData.id.slice(0, 8)}
              </span>
              <SeverityBadge severity={caseData.severity} size="sm" />
              <StatusBadge status={caseData.status} size="sm" />
              {caseData.overdue && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 border border-rose-800 text-rose-300 font-bold">
                  SLA OVERDUE
                </span>
              )}
            </div>
            <h1 className="text-xl font-black text-slate-100 tracking-tight mt-1">
              {caseData.alert_name}
            </h1>
          </div>
        </div>

        {/* Action Buttons: Assign to Me & Close Case */}
        <div className="flex items-center gap-3">
          {caseData.status !== 'closed' && (
            <>
              <button
                type="button"
                onClick={handleAssignToMe}
                disabled={isUpdating || caseData.assigned_l2 === (user?.name || user?.email)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>
                  {caseData.assigned_l2 === (user?.name || user?.email)
                    ? 'Assigned to You'
                    : 'Assign to Me'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleCloseCase}
                disabled={isUpdating}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Close Case</span>
              </button>
            </>
          )}

          {caseData.status === 'closed' && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 text-xs font-mono">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Case Closed</span>
            </div>
          )}
        </div>
      </div>

      {actionSuccessMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2 font-mono">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* Workflow Indicator */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-3">
          Incident Lifecycle Progression
        </p>
        <div className="grid grid-cols-5 gap-2 text-center">
          {[
            { step: 1, label: 'L1 Created' },
            { step: 2, label: 'L1 Triage' },
            { step: 3, label: 'L2 Investigation' },
            { step: 4, label: 'Response' },
            { step: 5, label: 'Closed' },
          ].map((item) => {
            const isCompleted = item.step < currentStep;
            const isCurrent = item.step === currentStep;

            return (
              <div key={item.step} className="flex flex-col items-center">
                <div
                  className={`w-full h-1.5 rounded-full mb-2 transition-all ${
                    isCurrent
                      ? 'bg-blue-500 shadow-sm shadow-blue-500/50'
                      : isCompleted
                      ? 'bg-emerald-500'
                      : 'bg-slate-800'
                  }`}
                />
                <span
                  className={`text-[11px] font-mono tracking-tight ${
                    isCurrent
                      ? 'font-bold text-blue-400'
                      : isCompleted
                      ? 'font-semibold text-emerald-400'
                      : 'text-slate-500'
                  }`}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid of Case Detail Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: Case Summary */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
            <Shield className="w-4 h-4 text-blue-400" />
            <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200">
              Case Summary
            </h2>
          </div>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Full Case ID:</span>
              <span className="text-slate-200 font-bold select-all">{caseData.id}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Current Status:</span>
              <StatusBadge status={caseData.status} size="sm" />
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Severity Tier:</span>
              <SeverityBadge severity={caseData.severity} size="sm" />
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Opened By:</span>
              <span className="text-slate-200">{caseData.opened_by || 'L1 Analyst'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Assigned L2:</span>
              <span className="text-blue-300 font-semibold">
                {caseData.assigned_l2 || 'Unassigned'}
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Alert Information */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200">
              Alert Information
            </h2>
          </div>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Alert Source:</span>
              <span className="text-slate-200">
                {caseData.details?.alert_source || 'SIEM / EDR Sensor'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Alert Name:</span>
              <span className="text-slate-200 font-sans font-medium text-right max-w-xs truncate">
                {caseData.alert_name}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Detected Timestamp:</span>
              <span className="text-slate-200">
                {caseData.details?.timestamp_detected
                  ? new Date(caseData.details.timestamp_detected).toLocaleString()
                  : '-'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">SLA Status:</span>
              <span className={caseData.overdue ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                {caseData.overdue ? 'BREACHED / OVERDUE' : 'WITHIN SLA'}
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Affected Assets */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
            <Server className="w-4 h-4 text-purple-400" />
            <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200">
              Affected Assets &amp; Principals
            </h2>
          </div>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Affected Host:</span>
              <span className="text-slate-100 font-bold">{caseData.affected_host}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Target User:</span>
              <span className="text-slate-200">{caseData.affected_user || 'SYSTEM / None'}</span>
            </div>
          </div>
        </div>

        {/* Section 4: Network Information */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
            <Network className="w-4 h-4 text-amber-400" />
            <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200">
              Network Information
            </h2>
          </div>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Source IP:</span>
              <span className="text-slate-200">{caseData.details?.source_ip || 'Internal / N/A'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Destination IP / C2:</span>
              <span className="text-slate-200">{caseData.details?.dest_ip || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Section 5: Classification */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
            <Tag className="w-4 h-4 text-blue-400" />
            <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200">
              Classification &amp; MITRE ATT&amp;CK
            </h2>
          </div>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Initial Classification:</span>
              <span className="text-slate-200 font-sans">
                {caseData.details?.initial_classification || 'Pending Classification'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">MITRE Tactic:</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-blue-300 border border-slate-700">
                {caseData.details?.mitre_tactic || 'TA0001 - Initial Access'}
              </span>
            </div>
          </div>
        </div>

        {/* Section 6: Timeline */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
            <Calendar className="w-4 h-4 text-rose-400" />
            <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200">
              Incident Timeline
            </h2>
          </div>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Opened At:</span>
              <span className="text-slate-200">
                {caseData.opened_at ? new Date(caseData.opened_at).toLocaleString() : '-'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Closed At:</span>
              <span className="text-slate-200">
                {caseData.closed_at ? new Date(caseData.closed_at).toLocaleString() : 'In Progress'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Description & Narrative */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 space-y-2">
        <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400">
          Incident Narrative Description
        </h3>
        <p className="text-xs text-slate-200 leading-relaxed font-sans bg-slate-950 p-4 rounded-lg border border-slate-800">
          {caseData.details?.description || 'No description recorded.'}
        </p>
      </div>

      {/* Section 7: Evidence & Raw Logs */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-blue-400" />
          <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200">
            Evidence &amp; Forensic Artifacts
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-2">
            <span className="text-[11px] font-mono uppercase text-slate-400 block">
              Raw Log Snippet (SIEM / Sensor Payload)
            </span>
            <pre className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[11px] text-emerald-400/90 overflow-x-auto max-h-60 leading-relaxed">
              <code>{caseData.details?.raw_log_snippet || 'No raw log provided.'}</code>
            </pre>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-2">
            <span className="text-[11px] font-mono uppercase text-slate-400 block">
              Extracted Indicators of Compromise (IOCs)
            </span>
            <pre className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[11px] text-blue-300/90 overflow-x-auto max-h-60 leading-relaxed">
              <code>{caseData.details?.iocs || 'No IOCs recorded.'}</code>
            </pre>
          </div>
        </div>
      </div>

      {/* Section 8: Investigation Workspace with Embedded AI IR Copilot */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-bold font-mono uppercase tracking-wider text-slate-100">
              Investigation Workspace
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Powered by Supabase Edge Functions
          </span>
        </div>

        {/* Embedded Copilot Panel */}
        <CopilotPanel caseId={caseData.id} />
      </div>
    </div>
  );
}

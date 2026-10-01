import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createCase } from '../../lib/cases';
import { useAuth } from '../../hooks/useAuth';
import { CaseSeverity, CreateCaseInput } from '../../types';
import {
  ShieldAlert,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Server,
  FileCode,
  Network,
  Tag,
  Clock,
} from 'lucide-react';

export function L1NewCase() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState<CreateCaseInput>({
    alert_source: 'CrowdStrike Falcon',
    alert_name: '',
    severity: 'High',
    timestamp_detected: new Date().toISOString().slice(0, 16),
    affected_host: '',
    description: '',
    raw_log_snippet: '',
    affected_user: '',
    source_ip: '',
    dest_ip: '',
    iocs: '',
    mitre_tactic: 'Initial Access',
    initial_classification: 'Malware / Ransomware Activity',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate required fields
    if (
      !formData.alert_source ||
      !formData.alert_name ||
      !formData.severity ||
      !formData.timestamp_detected ||
      !formData.affected_host ||
      !formData.description ||
      !formData.raw_log_snippet
    ) {
      setError('Please fill in all required fields indicated with an asterisk (*).');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createCase(formData, user?.id, user?.email);
      if (result.error) {
        setError(result.error);
        setIsSubmitting(false);
        return;
      }

      // Redirect to L1 Dashboard on success
      navigate('/l1/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to register incident case';
      setError(message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Navigation header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/l1/dashboard"
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-blue-400">
              Tier 1 Incident Intake
            </div>
            <h1 className="text-xl font-black text-slate-100 tracking-tight">
              Create New Incident Case
            </h1>
          </div>
        </div>

        <span className="text-xs font-mono text-slate-500 hidden sm:block">
          Form: SOC-INTAKE-v1
        </span>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
          <div>
            <p className="font-bold">Intake Validation Error</p>
            <p className="mt-0.5 text-rose-300/80">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Alert Information (Required) */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <ShieldAlert className="w-4 h-4 text-blue-400" />
            <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200">
              1. Alert &amp; Threat Information (Required)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                Alert Source *
              </label>
              <select
                required
                value={formData.alert_source}
                onChange={(e) => setFormData({ ...formData, alert_source: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:border-blue-500 outline-none"
              >
                <option value="CrowdStrike Falcon">CrowdStrike Falcon EDR</option>
                <option value="Microsoft Defender for Endpoint">Microsoft Defender for Endpoint</option>
                <option value="Splunk SIEM">Splunk SIEM</option>
                <option value="FortiSIEM">FortiSIEM</option>
                <option value="Elastic Security (EQL)">Elastic Security (EQL)</option>
                <option value="Palo Alto Cortex XDR">Palo Alto Cortex XDR</option>
                <option value="Suricata / Zeek IDS">Suricata / Zeek IDS</option>
                <option value="Proofpoint Email Security">Proofpoint Email Security</option>
                <option value="AWS GuardDuty">AWS GuardDuty</option>
                <option value="Custom / Other">Custom / Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                Severity *
              </label>
              <select
                required
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value as CaseSeverity })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:border-blue-500 outline-none font-semibold"
              >
                <option value="Low">Low - Informational / Minor anomaly</option>
                <option value="Medium">Medium - Suspicious activity detected</option>
                <option value="High">High - Malicious execution or persistence</option>
                <option value="Critical">Critical - Active lateral movement / Ransomware</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                Alert Name *
              </label>
              <input
                type="text"
                required
                value={formData.alert_name}
                onChange={(e) => setFormData({ ...formData, alert_name: e.target.value })}
                placeholder="e.g. CobaltStrike Beacon Detected via PowerShell encoded command"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:border-blue-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                Timestamp Detected *
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  required
                  value={formData.timestamp_detected}
                  onChange={(e) => setFormData({ ...formData, timestamp_detected: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:border-blue-500 outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                Affected Host / Asset *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={formData.affected_host}
                  onChange={(e) => setFormData({ ...formData, affected_host: e.target.value })}
                  placeholder="e.g. DC-PROD-01.corp.internal"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:border-blue-500 outline-none font-mono"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                Incident Description *
              </label>
              <textarea
                required
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed explanation of the alert, trigger conditions, and initial observations..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                Raw Log Snippet * (Monospace)
              </label>
              <textarea
                required
                rows={4}
                value={formData.raw_log_snippet}
                onChange={(e) => setFormData({ ...formData, raw_log_snippet: e.target.value })}
                placeholder="Paste SIEM / EDR raw syslog, JSON log, or command line payload..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-emerald-400 placeholder-slate-600 focus:border-blue-500 outline-none font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Contextual Entities & Network (Optional) */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Network className="w-4 h-4 text-purple-400" />
            <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200">
              2. Entities, Network &amp; IOCs (Optional)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                Affected User Principal
              </label>
              <input
                type="text"
                value={formData.affected_user || ''}
                onChange={(e) => setFormData({ ...formData, affected_user: e.target.value })}
                placeholder="e.g. jdoe@corp.internal"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:border-blue-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                Source IP Address
              </label>
              <input
                type="text"
                value={formData.source_ip || ''}
                onChange={(e) => setFormData({ ...formData, source_ip: e.target.value })}
                placeholder="e.g. 192.168.1.105"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:border-blue-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                Destination IP / C2
              </label>
              <input
                type="text"
                value={formData.dest_ip || ''}
                onChange={(e) => setFormData({ ...formData, dest_ip: e.target.value })}
                placeholder="e.g. 198.51.100.42"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:border-blue-500 outline-none font-mono"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                Indicators of Compromise (IOCs) - Hashes, Domains, URLs
              </label>
              <textarea
                rows={2}
                value={formData.iocs || ''}
                onChange={(e) => setFormData({ ...formData, iocs: e.target.value })}
                placeholder="e.g. SHA256: 4a3c10b42f... | Domain: evil-c2-domain.xyz"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:border-blue-500 outline-none font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Classification & MITRE (Optional) */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Tag className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200">
              3. Initial Classification &amp; MITRE ATT&amp;CK
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                MITRE ATT&amp;CK Tactic
              </label>
              <select
                value={formData.mitre_tactic || ''}
                onChange={(e) => setFormData({ ...formData, mitre_tactic: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:border-blue-500 outline-none"
              >
                <option value="Initial Access">TA0001 - Initial Access</option>
                <option value="Execution">TA0002 - Execution</option>
                <option value="Persistence">TA0003 - Persistence</option>
                <option value="Privilege Escalation">TA0004 - Privilege Escalation</option>
                <option value="Defense Evasion">TA0005 - Defense Evasion</option>
                <option value="Credential Access">TA0006 - Credential Access</option>
                <option value="Discovery">TA0007 - Discovery</option>
                <option value="Lateral Movement">TA0008 - Lateral Movement</option>
                <option value="Collection">TA0009 - Collection</option>
                <option value="Command and Control">TA0011 - Command and Control</option>
                <option value="Exfiltration">TA0010 - Exfiltration</option>
                <option value="Impact">TA0040 - Impact</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                Initial Classification
              </label>
              <input
                type="text"
                value={formData.initial_classification || ''}
                onChange={(e) => setFormData({ ...formData, initial_classification: e.target.value })}
                placeholder="e.g. Ransomware / Unauthorized Remote Admin Tool"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3">
          <Link
            to="/l1/dashboard"
            className="px-4 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-md shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Creating Case in Supabase...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Submit &amp; Create Case</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

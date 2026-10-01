export type UserRole = 'L1' | 'L2' | 'admin';

export type CaseSeverity = 'Low' | 'Medium' | 'High' | 'Critical';
export type CaseStatus = 'open' | 'investigating' | 'closed';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  is_active: boolean;
  created_at?: string;
}

export interface Case {
  id: string;
  case_number?: string | number;
  alert_name: string;
  severity: CaseSeverity;
  status: CaseStatus;
  affected_host: string;
  affected_user?: string | null;
  opened_at: string;
  closed_at?: string | null;
  opened_by?: string | null;
  assigned_l2?: string | null;
  overdue?: boolean;
  created_at?: string;
}

export interface CaseDetails {
  id: string;
  case_id: string;
  alert_source: string;
  timestamp_detected: string;
  description: string;
  raw_log_snippet: string;
  source_ip?: string | null;
  dest_ip?: string | null;
  iocs?: string | null;
  mitre_tactic?: string | null;
  initial_classification?: string | null;
  created_at?: string;
}

export interface FullCaseData extends Case {
  details?: CaseDetails | null;
}

export interface IncidentRegisterRow {
  case_id: string;
  severity: CaseSeverity;
  status: CaseStatus;
  overdue: boolean;
  alert_name: string;
  affected_host: string;
  affected_user?: string | null;
  opened_at: string;
  closed_at?: string | null;
  opened_by?: string | null;
  assigned_l2?: string | null;
}

export interface DashboardSummary {
  open_for_triage?: number;
  active_investigations?: number;
  high_critical?: number;
  overdue?: number;
  closed?: number;
}

export type CopilotTool =
  | 'PowerShell'
  | 'Windows Event Log'
  | 'Splunk (SPL)'
  | 'FortiSIEM (SQL)'
  | 'Kibana (EQL)';

export const COPILOT_TOOLS: CopilotTool[] = [
  'PowerShell',
  'Windows Event Log',
  'Splunk (SPL)',
  'FortiSIEM (SQL)',
  'Kibana (EQL)',
];

export interface CopilotRun {
  id: string;
  case_id: string;
  tool_used: CopilotTool | string;
  output_playbook: string;
  run_by?: string | null;
  created_at: string;
}

export interface AgentSkill {
  id: string;
  name: string;
  description: string;
  prompt_template?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AIConfig {
  id: string;
  provider: string;
  model: string;
  api_key_masked: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCaseInput {
  alert_source: string;
  alert_name: string;
  severity: CaseSeverity;
  timestamp_detected: string;
  affected_host: string;
  description: string;
  raw_log_snippet: string;
  affected_user?: string;
  source_ip?: string;
  dest_ip?: string;
  iocs?: string;
  mitre_tactic?: string;
  initial_classification?: string;
}

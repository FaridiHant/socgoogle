# SOC Incident Case Management Platform (Frontend)

Standalone, enterprise-grade Security Operations Center (SOC) Incident Case Management Platform built with React, TypeScript, Vite, Tailwind CSS, and the Supabase JavaScript Client.

## Architecture Highlights

- **Pure Frontend Architecture**: Connects directly to existing Supabase instances via `@supabase/supabase-js` using standard public anon key credentials.
- **Strict Role-Based Access Control (RBAC)**:
  - **L1 (Alert Ingest & Triage)**: Triages incoming alerts, captures raw logs and IOCs, creates incident cases, and hands off to L2. Cannot access Incident Register, L2 Case Details, AI IR Copilot, or Admin.
  - **L2 (Incident Response & Forensics)**: Receives and investigates existing L1 cases, executes AI IR Copilot playbooks, validates evidence, assigns cases, and closes incidents. Never creates new cases.
  - **Admin (Governance & Infrastructure)**: Manages SOC operators, AI model configurations, prompt engineering agent skills, and Supabase connection parameters.
- **AI IR Copilot**: Invokes the Supabase Edge Function `run-copilot` with strictly typed investigation tools (`PowerShell`, `Windows Event Log`, `Splunk (SPL)`, `FortiSIEM (SQL)`, `Kibana (EQL)`) and renders formatted playbooks and execution history.
- **Client-Side PDF Export**: Generates filtered incident reports client-side using `jspdf` and `jspdf-autotable` without backend dependencies (available only in Tier 2).

## Backend Contract (Supabase)

The frontend is designed to consume existing Supabase resources:

### Tables
- `users`: `id`, `email`, `name`, `role` (`L1` | `L2` | `admin`), `is_active`, `created_at`
- `cases`: `id`, `alert_name`, `severity`, `status`, `affected_host`, `affected_user`, `opened_at`, `closed_at`, `opened_by`, `assigned_l2`, `overdue`
- `case_details`: `id`, `case_id`, `alert_source`, `timestamp_detected`, `description`, `raw_log_snippet`, `source_ip`, `dest_ip`, `iocs`, `mitre_tactic`, `initial_classification`
- `copilot_runs`: `id`, `case_id`, `tool_used`, `output_playbook`, `run_by`, `created_at`
- `agent_skills`: `id`, `name`, `description`, `prompt_template`, `is_active`, `created_at`, `updated_at`
- `ai_config`: `id`, `provider`, `model`, `api_key_masked`, `created_at`, `updated_at`

### Views
- `dashboard_summary`: Metrics for open triage, active investigations, high/critical alerts, and overdue cases
- `cases_with_status`: Case list with computed status
- `incident_register`: Master incident table for L2 audit and PDF export

### Edge Functions
- `run-copilot`: Accepts `{ case_id, tool_used }` and returns `{ output_playbook }`
- `admin-create-user`: Provisions new analyst credentials and user registry records

## Environment Variables

Configure your environment in `.env` or in the application UI (Admin &gt; Backend Connection):

```env
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
```

*Note: Only the Supabase Anon Key is used in client code. Never use service-role keys.*

## Development & Build

```bash
# Install dependencies
npm install

# Run development server (Port 3000)
npm run dev

# Type check
npm run lint

# Production build
npm run build
```

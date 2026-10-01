import { getSupabase } from './supabase';
import { IncidentRegisterRow, CaseSeverity, CaseStatus } from '../types';

export interface IncidentFilters {
  search?: string;
  severity?: CaseSeverity | 'All';
  status?: CaseStatus | 'All';
  overdueOnly?: boolean;
}

export async function getIncidents(filters?: IncidentFilters): Promise<{
  data: IncidentRegisterRow[] | null;
  error: string | null;
}> {
  const supabase = getSupabase();
  try {
    // 1. Try querying the incident_register view
    let query = supabase.from('incident_register').select('*').order('opened_at', { ascending: false });

    if (filters?.severity && filters.severity !== 'All') {
      query = query.eq('severity', filters.severity);
    }

    if (filters?.status && filters.status !== 'All') {
      query = query.eq('status', filters.status);
    }

    if (filters?.overdueOnly) {
      query = query.eq('overdue', true);
    }

    const { data: viewData, error: viewError } = await query;

    if (!viewError && viewData) {
      let filtered = viewData as IncidentRegisterRow[];

      if (filters?.search && filters.search.trim()) {
        const s = filters.search.trim().toLowerCase();
        filtered = filtered.filter(
          (row) =>
            row.case_id?.toLowerCase().includes(s) ||
            row.alert_name?.toLowerCase().includes(s) ||
            row.affected_host?.toLowerCase().includes(s) ||
            row.affected_user?.toLowerCase().includes(s) ||
            row.assigned_l2?.toLowerCase().includes(s)
        );
      }

      return { data: filtered, error: null };
    }

    // 2. Fallback: Query cases table directly
    let casesQuery = supabase.from('cases').select('*').order('opened_at', { ascending: false });

    if (filters?.severity && filters.severity !== 'All') {
      casesQuery = casesQuery.eq('severity', filters.severity);
    }

    if (filters?.status && filters.status !== 'All') {
      casesQuery = casesQuery.eq('status', filters.status);
    }

    if (filters?.overdueOnly) {
      casesQuery = casesQuery.eq('overdue', true);
    }

    const { data: casesData, error: casesError } = await casesQuery;

    if (casesError) {
      return { data: null, error: casesError.message };
    }

    let mapped: IncidentRegisterRow[] = (casesData || []).map((c) => ({
      case_id: c.id,
      severity: c.severity,
      status: c.status,
      overdue: Boolean(c.overdue),
      alert_name: c.alert_name,
      affected_host: c.affected_host,
      affected_user: c.affected_user,
      opened_at: c.opened_at,
      closed_at: c.closed_at,
      opened_by: c.opened_by,
      assigned_l2: c.assigned_l2,
    }));

    if (filters?.search && filters.search.trim()) {
      const s = filters.search.trim().toLowerCase();
      mapped = mapped.filter(
        (row) =>
          row.case_id?.toLowerCase().includes(s) ||
          row.alert_name?.toLowerCase().includes(s) ||
          row.affected_host?.toLowerCase().includes(s) ||
          row.affected_user?.toLowerCase().includes(s) ||
          row.assigned_l2?.toLowerCase().includes(s)
      );
    }

    return { data: mapped, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to query incidents';
    return { data: null, error: message };
  }
}

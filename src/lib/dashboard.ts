import { getSupabase } from './supabase';
import { DashboardSummary, Case, IncidentRegisterRow } from '../types';

export async function getDashboardSummary(): Promise<{
  data: DashboardSummary | null;
  error: string | null;
}> {
  const supabase = getSupabase();
  try {
    // 1. Try querying dashboard_summary view
    const { data: viewData, error: viewError } = await supabase
      .from('dashboard_summary')
      .select('*')
      .maybeSingle();

    if (!viewError && viewData) {
      return {
        data: {
          open_for_triage: Number(viewData.open_for_triage ?? viewData.open ?? 0),
          active_investigations: Number(viewData.active_investigations ?? viewData.investigating ?? 0),
          high_critical: Number(viewData.high_critical ?? 0),
          overdue: Number(viewData.overdue ?? 0),
          closed: Number(viewData.closed ?? 0),
        },
        error: null,
      };
    }

    // 2. Fallback: Aggregate directly from cases table if view is not accessible
    const { data: casesData, error: casesError } = await supabase
      .from('cases')
      .select('status, severity, overdue');

    if (casesError) {
      return {
        data: null,
        error: casesError.message,
      };
    }

    const summary: DashboardSummary = {
      open_for_triage: casesData?.filter((c) => c.status === 'open').length ?? 0,
      active_investigations: casesData?.filter((c) => c.status === 'investigating').length ?? 0,
      high_critical: casesData?.filter((c) => c.severity === 'High' || c.severity === 'Critical').length ?? 0,
      overdue: casesData?.filter((c) => Boolean(c.overdue)).length ?? 0,
      closed: casesData?.filter((c) => c.status === 'closed').length ?? 0,
    };

    return { data: summary, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load dashboard summary';
    return { data: null, error: message };
  }
}

export async function getL1TriageQueue(): Promise<{
  data: Case[] | null;
  error: string | null;
}> {
  const supabase = getSupabase();
  try {
    // Try cases_with_status view first, otherwise fallback to cases table
    const { data, error } = await supabase
      .from('cases')
      .select('*')
      .order('opened_at', { ascending: false });

    if (error) {
      // If error, try cases_with_status
      const { data: viewData, error: viewError } = await supabase
        .from('cases_with_status')
        .select('*')
        .order('opened_at', { ascending: false });

      if (viewError) {
        return { data: null, error: error.message };
      }
      return { data: viewData as Case[], error: null };
    }

    return { data: data as Case[], error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load L1 triage queue';
    return { data: null, error: message };
  }
}

export async function getL2PriorityInvestigations(): Promise<{
  data: IncidentRegisterRow[] | null;
  error: string | null;
}> {
  const supabase = getSupabase();
  try {
    // Priority: investigating or open, High/Critical or Overdue
    const { data, error } = await supabase
      .from('incident_register')
      .select('*')
      .in('status', ['open', 'investigating'])
      .order('opened_at', { ascending: false })
      .limit(10);

    if (error) {
      // Fallback query to cases table
      const { data: casesData, error: casesError } = await supabase
        .from('cases')
        .select('*')
        .in('status', ['open', 'investigating'])
        .order('opened_at', { ascending: false })
        .limit(10);

      if (casesError) {
        return { data: null, error: error.message };
      }

      // Map to incident register shape
      const mapped = casesData.map((c) => ({
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

      return { data: mapped as IncidentRegisterRow[], error: null };
    }

    return { data: data as IncidentRegisterRow[], error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load priority investigations';
    return { data: null, error: message };
  }
}

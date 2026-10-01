import { getSupabase } from './supabase';
import { Case, CaseDetails, CreateCaseInput, FullCaseData } from '../types';

export async function getCase(id: string): Promise<{
  data: FullCaseData | null;
  error: string | null;
}> {
  const supabase = getSupabase();
  try {
    // 1. Fetch base case
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (caseError) {
      return { data: null, error: caseError.message };
    }

    if (!caseData) {
      return { data: null, error: `Case #${id} not found.` };
    }

    // 2. Fetch associated case_details
    const { data: detailsData, error: detailsError } = await supabase
      .from('case_details')
      .select('*')
      .eq('case_id', id)
      .maybeSingle();

    if (detailsError) {
      // If error querying case_details, still return case with null details
      return {
        data: {
          ...caseData,
          details: null,
        } as FullCaseData,
        error: null,
      };
    }

    return {
      data: {
        ...caseData,
        details: detailsData as CaseDetails | null,
      } as FullCaseData,
      error: null,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve case';
    return { data: null, error: message };
  }
}

export async function createCase(
  input: CreateCaseInput,
  openedByUserId?: string,
  openedByEmail?: string
): Promise<{
  data: Case | null;
  error: string | null;
}> {
  const supabase = getSupabase();
  try {
    const nowIso = new Date().toISOString();

    // 1. Insert into cases
    const { data: newCase, error: caseError } = await supabase
      .from('cases')
      .insert({
        alert_name: input.alert_name.trim(),
        severity: input.severity,
        status: 'open',
        affected_host: input.affected_host.trim(),
        affected_user: input.affected_user?.trim() || null,
        opened_at: nowIso,
        opened_by: openedByEmail || openedByUserId || 'L1 Operator',
        overdue: false,
      })
      .select()
      .single();

    if (caseError) {
      return { data: null, error: caseError.message };
    }

    // 2. Insert into case_details
    const { error: detailsError } = await supabase
      .from('case_details')
      .insert({
        case_id: newCase.id,
        alert_source: input.alert_source.trim(),
        timestamp_detected: input.timestamp_detected || nowIso,
        description: input.description.trim(),
        raw_log_snippet: input.raw_log_snippet.trim(),
        source_ip: input.source_ip?.trim() || null,
        dest_ip: input.dest_ip?.trim() || null,
        iocs: input.iocs?.trim() || null,
        mitre_tactic: input.mitre_tactic?.trim() || null,
        initial_classification: input.initial_classification?.trim() || null,
      });

    if (detailsError) {
      console.warn('Warning: Case created but failed to store case_details:', detailsError.message);
    }

    return { data: newCase as Case, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create case';
    return { data: null, error: message };
  }
}

export async function assignCase(
  caseId: string,
  assignedTo: string
): Promise<{
  success: boolean;
  error: string | null;
}> {
  const supabase = getSupabase();
  try {
    const { error } = await supabase
      .from('cases')
      .update({
        assigned_l2: assignedTo,
        status: 'investigating',
      })
      .eq('id', caseId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to assign case';
    return { success: false, error: message };
  }
}

export async function closeCase(
  caseId: string
): Promise<{
  success: boolean;
  error: string | null;
}> {
  const supabase = getSupabase();
  try {
    const { error } = await supabase
      .from('cases')
      .update({
        status: 'closed',
        closed_at: new Date().toISOString(),
      })
      .eq('id', caseId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to close case';
    return { success: false, error: message };
  }
}

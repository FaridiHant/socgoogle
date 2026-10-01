import { getSupabase } from './supabase';
import { CopilotRun, CopilotTool } from '../types';

export interface RunCopilotResponse {
  output_playbook?: string;
  error?: string;
}

export async function runCopilot(
  caseId: string,
  toolUsed: CopilotTool
): Promise<{
  data: CopilotRun | null;
  error: string | null;
}> {
  const supabase = getSupabase();
  try {
    // 1. Invoke Supabase Edge Function 'run-copilot'
    const { data: edgeFunctionResult, error: invokeError } = await supabase.functions.invoke('run-copilot', {
      body: {
        case_id: caseId,
        tool_used: toolUsed,
      },
    });

    if (invokeError) {
      return {
        data: null,
        error: `Copilot Edge Function error: ${invokeError.message}`,
      };
    }

    const playbook = edgeFunctionResult?.output_playbook || edgeFunctionResult?.playbook || edgeFunctionResult?.text;
    if (!playbook) {
      if (edgeFunctionResult?.error) {
        return { data: null, error: edgeFunctionResult.error };
      }
      return {
        data: null,
        error: 'No investigation playbook returned from Copilot.',
      };
    }

    // 2. Fetch the newly inserted run record from copilot_runs (or return structured object)
    const { data: latestRun } = await supabase
      .from('copilot_runs')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestRun) {
      return { data: latestRun as CopilotRun, error: null };
    }

    // If edge function returned playbook but didn't write to DB directly, return constructed object
    return {
      data: {
        id: crypto.randomUUID(),
        case_id: caseId,
        tool_used: toolUsed,
        output_playbook: playbook,
        created_at: new Date().toISOString(),
      },
      error: null,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to execute AI IR Copilot';
    return { data: null, error: message };
  }
}

export async function getCopilotHistory(caseId: string): Promise<{
  data: CopilotRun[] | null;
  error: string | null;
}> {
  const supabase = getSupabase();
  try {
    const { data, error } = await supabase
      .from('copilot_runs')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: (data as CopilotRun[]) || [], error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve copilot history';
    return { data: null, error: message };
  }
}

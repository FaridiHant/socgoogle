import { getSupabase } from './supabase';
import { User, UserRole, AIConfig, AgentSkill } from '../types';

export async function getAdminUsers(): Promise<{
  data: User[] | null;
  error: string | null;
}> {
  const supabase = getSupabase();
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as User[], error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve SOC users';
    return { data: null, error: message };
  }
}

export async function toggleUserActive(
  userId: string,
  isActive: boolean
): Promise<{
  success: boolean;
  error: string | null;
}> {
  const supabase = getSupabase();
  try {
    const { error } = await supabase
      .from('users')
      .update({ is_active: isActive })
      .eq('id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update user status';
    return { success: false, error: message };
  }
}

export async function provisionUser(payload: {
  email: string;
  name: string;
  role: UserRole;
  password?: string;
}): Promise<{
  success: boolean;
  user?: User;
  error: string | null;
}> {
  const supabase = getSupabase();
  try {
    // 1. Try invoking admin-create-user edge function
    const { data: edgeResult, error: edgeError } = await supabase.functions.invoke(
      'admin-create-user',
      {
        body: payload,
      }
    );

    if (edgeError) {
      // If edge function returned an error, report it
      return {
        success: false,
        error: `admin-create-user function error: ${edgeError.message}`,
      };
    }

    return {
      success: true,
      user: edgeResult?.user,
      error: null,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to provision user';
    return { success: false, error: message };
  }
}

export async function getAIConfig(): Promise<{
  data: AIConfig | null;
  error: string | null;
}> {
  const supabase = getSupabase();
  try {
    const { data, error } = await supabase
      .from('ai_config')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as AIConfig | null, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch AI configuration';
    return { data: null, error: message };
  }
}

export async function updateAIConfig(payload: {
  id?: string;
  provider: string;
  model: string;
  api_key?: string;
}): Promise<{
  success: boolean;
  error: string | null;
}> {
  const supabase = getSupabase();
  try {
    const updateObj: Record<string, unknown> = {
      provider: payload.provider,
      model: payload.model,
      updated_at: new Date().toISOString(),
    };

    if (payload.api_key && payload.api_key.trim()) {
      const trimmed = payload.api_key.trim();
      const masked = trimmed.length > 8
        ? `${trimmed.substring(0, 4)}••••••••${trimmed.substring(trimmed.length - 4)}`
        : '••••••••••••';
      updateObj.api_key_masked = masked;
    }

    if (payload.id) {
      const { error } = await supabase
        .from('ai_config')
        .update(updateObj)
        .eq('id', payload.id);

      if (error) return { success: false, error: error.message };
    } else {
      const { error } = await supabase
        .from('ai_config')
        .insert({
          ...updateObj,
          api_key_masked: updateObj.api_key_masked || '••••••••••••',
        });

      if (error) return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update AI config';
    return { success: false, error: message };
  }
}

export async function getAgentSkills(): Promise<{
  data: AgentSkill[] | null;
  error: string | null;
}> {
  const supabase = getSupabase();
  try {
    const { data, error } = await supabase
      .from('agent_skills')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: (data as AgentSkill[]) || [], error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch agent skills';
    return { data: null, error: message };
  }
}

export async function createAgentSkill(payload: {
  name: string;
  description: string;
  prompt_template?: string;
}): Promise<{
  data: AgentSkill | null;
  error: string | null;
}> {
  const supabase = getSupabase();
  try {
    const { data, error } = await supabase
      .from('agent_skills')
      .insert({
        name: payload.name.trim(),
        description: payload.description.trim(),
        prompt_template: payload.prompt_template?.trim() || null,
        is_active: false,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as AgentSkill, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create skill';
    return { data: null, error: message };
  }
}

export async function activateAgentSkill(skillId: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  const supabase = getSupabase();
  try {
    // 1. Deactivate all skills (only one active at a time)
    await supabase.from('agent_skills').update({ is_active: false }).neq('id', skillId);

    // 2. Activate chosen skill
    const { error } = await supabase
      .from('agent_skills')
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq('id', skillId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to activate skill';
    return { success: false, error: message };
  }
}

export async function deactivateAgentSkill(skillId: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  const supabase = getSupabase();
  try {
    const { error } = await supabase
      .from('agent_skills')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', skillId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to deactivate skill';
    return { success: false, error: message };
  }
}

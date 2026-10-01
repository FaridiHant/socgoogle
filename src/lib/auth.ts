import { getSupabase } from './supabase';
import { User, UserRole } from '../types';

export interface AuthResult {
  user: User | null;
  role: UserRole | null;
  error: string | null;
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  const supabase = getSupabase();

  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      return {
        user: null,
        role: null,
        error: authError.message,
      };
    }

    if (!authData.user) {
      return {
        user: null,
        role: null,
        error: 'Authentication failed: No user returned',
      };
    }

    // Step 2 & 3: Retrieve corresponding row from users and verify is_active
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (profileError) {
      // If error querying by ID, try querying by email as fallback
      const { data: userByEmail, error: emailError } = await supabase
        .from('users')
        .select('*')
        .eq('email', authData.user.email ?? email.trim())
        .maybeSingle();

      if (emailError || !userByEmail) {
        await supabase.auth.signOut();
        return {
          user: null,
          role: null,
          error: 'SOC Profile Error: User is authenticated but has no provisioned record in SOC users directory.',
        };
      }

      if (!userByEmail.is_active) {
        await supabase.auth.signOut();
        return {
          user: null,
          role: null,
          error: 'Access Denied: Your SOC account is deactivated. Contact an administrator.',
        };
      }

      return {
        user: userByEmail as User,
        role: userByEmail.role as UserRole,
        error: null,
      };
    }

    if (!userProfile) {
      await supabase.auth.signOut();
      return {
        user: null,
        role: null,
        error: 'Access Denied: No SOC user record found for this account.',
      };
    }

    if (!userProfile.is_active) {
      await supabase.auth.signOut();
      return {
        user: null,
        role: null,
        error: 'Access Denied: Your SOC operator profile is inactive.',
      };
    }

    return {
      user: userProfile as User,
      role: userProfile.role as UserRole,
      error: null,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown login error';
    return {
      user: null,
      role: null,
      error: message,
    };
  }
}

export async function signOut(): Promise<void> {
  const supabase = getSupabase();
  await supabase.auth.signOut();
}

export async function getCurrentUserProfile(): Promise<User | null> {
  const supabase = getSupabase();
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    const { data: userProfile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();

    if (error || !userProfile) {
      // Fallback query by email
      const { data: fallbackUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', session.user.email ?? '')
        .maybeSingle();

      if (fallbackUser && fallbackUser.is_active) {
        return fallbackUser as User;
      }
      return null;
    }

    if (!userProfile.is_active) {
      await supabase.auth.signOut();
      return null;
    }

    return userProfile as User;
  } catch {
    return null;
  }
}

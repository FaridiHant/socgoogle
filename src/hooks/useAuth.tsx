import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User, UserRole } from '../types';
import { getCurrentUserProfile, signIn as authSignIn, signOut as authSignOut } from '../lib/auth';
import { getSupabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isLoading: boolean;
  signIn: (email: string, pass: string) => Promise<{ success: boolean; error?: string; role?: UserRole }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    try {
      const profile = await getCurrentUserProfile();
      setUser(profile);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();

    const supabase = getSupabase();
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          const profile = await getCurrentUserProfile();
          setUser(profile);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [refreshUser]);

  const handleSignIn = async (email: string, pass: string) => {
    setIsLoading(true);
    const result = await authSignIn(email, pass);
    setIsLoading(false);

    if (result.error || !result.user) {
      return { success: false, error: result.error || 'Failed to authenticate.' };
    }

    setUser(result.user);
    return { success: true, role: result.role || result.user.role };
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    await authSignOut();
    setUser(null);
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role ?? null,
        isLoading,
        signIn: handleSignIn,
        signOut: handleSignOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';
import { LoadingState } from './LoadingState';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <LoadingState message="Verifying SOC Security Credentials..." subMessage="Checking operator authorization" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

interface RoleRouteProps {
  children: ReactNode;
  allowedRoles: UserRole[];
}

export function RoleRoute({ children, allowedRoles }: RoleRouteProps) {
  const { user, role, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <LoadingState message="Evaluating Role Access..." subMessage="RBAC Policy Validation" />
      </div>
    );
  }

  if (!user || !role) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(role)) {
    // Redirect unauthorized user strictly to their authorized home dashboard
    if (role === 'L1') return <Navigate to="/l1/dashboard" replace />;
    if (role === 'L2') return <Navigate to="/l2/dashboard" replace />;
    if (role === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export function L1Route({ children }: { children: ReactNode }) {
  return <RoleRoute allowedRoles={['L1']}>{children}</RoleRoute>;
}

export function L2Route({ children }: { children: ReactNode }) {
  return <RoleRoute allowedRoles={['L2']}>{children}</RoleRoute>;
}

export function AdminRoute({ children }: { children: ReactNode }) {
  return <RoleRoute allowedRoles={['admin']}>{children}</RoleRoute>;
}

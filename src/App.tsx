import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './hooks/useTheme';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { AppShell } from './layouts/AppShell';
import { ProtectedRoute, L1Route, L2Route, AdminRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/login/LoginPage';
import { L1Dashboard } from './pages/l1/L1Dashboard';
import { L1NewCase } from './pages/l1/L1NewCase';
import { L2Dashboard } from './pages/l2/L2Dashboard';
import { L2IncidentRegister } from './pages/l2/L2IncidentRegister';
import { L2CaseDetail } from './pages/l2/L2CaseDetail';
import { AdminPage } from './pages/admin/AdminPage';
import { LoadingState } from './components/LoadingState';

function RootRedirect() {
  const { user, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <LoadingState message="Initializing SOC Console..." subMessage="Validating active session" />
      </div>
    );
  }

  if (!user || !role) {
    return <Navigate to="/login" replace />;
  }

  if (role === 'L1') return <Navigate to="/l1/dashboard" replace />;
  if (role === 'L2') return <Navigate to="/l2/dashboard" replace />;
  if (role === 'admin') return <Navigate to="/admin" replace />;

  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Login Route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Smart Root Dispatcher */}
            <Route path="/" element={<RootRedirect />} />

            {/* L1 Tier Routes - Strictly Isolated */}
            <Route
              path="/l1/dashboard"
              element={
                <L1Route>
                  <AppShell>
                    <L1Dashboard />
                  </AppShell>
                </L1Route>
              }
            />
            <Route
              path="/l1/cases/new"
              element={
                <L1Route>
                  <AppShell>
                    <L1NewCase />
                  </AppShell>
                </L1Route>
              }
            />
            <Route
              path="/l1/new-case"
              element={
                <L1Route>
                  <AppShell>
                    <L1NewCase />
                  </AppShell>
                </L1Route>
              }
            />

            {/* L2 Tier Routes - Strictly Isolated, NEVER NEW CASE */}
            <Route
              path="/l2/dashboard"
              element={
                <L2Route>
                  <AppShell>
                    <L2Dashboard />
                  </AppShell>
                </L2Route>
              }
            />
            <Route
              path="/l2/incidents"
              element={
                <L2Route>
                  <AppShell>
                    <L2IncidentRegister />
                  </AppShell>
                </L2Route>
              }
            />
            <Route
              path="/l2/cases"
              element={
                <L2Route>
                  <AppShell>
                    <L2IncidentRegister />
                  </AppShell>
                </L2Route>
              }
            />
            <Route
              path="/l2/cases/:id"
              element={
                <L2Route>
                  <AppShell>
                    <L2CaseDetail />
                  </AppShell>
                </L2Route>
              }
            />
            <Route
              path="/l2/incidents/:id"
              element={
                <L2Route>
                  <AppShell>
                    <L2CaseDetail />
                  </AppShell>
                </L2Route>
              }
            />

            {/* Admin Tier Route */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AppShell>
                    <AdminPage />
                  </AppShell>
                </AdminRoute>
              }
            />

            {/* Catch-all Fallback */}
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme/theme';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage        from './pages/LoginPage';
import RegisterPage     from './pages/RegisterPage';
import MatchListPage    from './pages/MatchListPage';
import MatchDetailsPage from './pages/MatchDetailsPage';
import DashboardPage    from './pages/DashboardPage';
import AdminUsersPage   from './pages/AdminUsersPage';
import TeamsPage        from './pages/TeamsPage';

function PrivateRoute({ children, adminOnly = false }) {
  const { user, isAdmin } = useAuth();
  if (!user)              return <Navigate to="/login"   replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/matches" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user } = useAuth();
  return user ? <Navigate to="/matches" replace /> : children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

      <Route path="/matches"    element={<PrivateRoute><MatchListPage /></PrivateRoute>} />
      <Route path="/matches/:id" element={<PrivateRoute><MatchDetailsPage /></PrivateRoute>} />
      <Route path="/teams"      element={<PrivateRoute><TeamsPage /></PrivateRoute>} />
      <Route path="/dashboard"  element={<PrivateRoute><DashboardPage /></PrivateRoute>} />

      <Route
        path="/admin/users"
        element={<PrivateRoute adminOnly><AdminUsersPage /></PrivateRoute>}
      />

      <Route path="*" element={<Navigate to="/matches" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

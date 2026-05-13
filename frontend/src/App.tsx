import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import RequireAuth from './auth/RequireAuth';
import { ToastProvider } from './ui/Toast';
import DemoBanner from './ui/DemoBanner';

import PublicShell from './layout/PublicShell';
import AppShell from './layout/AppShell';

import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import AboutPage from './pages/public/AboutPage';
import PlanesPage from './pages/public/PlanesPage';

import OnboardingPage from './pages/app/OnboardingPage';
import DashboardPage from './pages/app/DashboardPage';
import MatchPage from './pages/app/MatchPage';
import ChatPage from './pages/app/ChatPage';
import VitrinaPage from './pages/app/VitrinaPage';
import PerfilPage from './pages/app/PerfilPage';

import AdminPage from './admin/AdminPage';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
      <Routes>
        {/* Public */}
        <Route element={<PublicShell />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegisterPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/planes" element={<PlanesPage />} />
        </Route>

        {/* Onboarding (auth required pero sin AppShell) */}
        <Route
          path="/onboarding"
          element={
            <RequireAuth>
              <OnboardingPage />
            </RequireAuth>
          }
        />

        {/* Protected App */}
        <Route
          path="/app"
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="match" element={<MatchPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="vitrina" element={<VitrinaPage />} />
          <Route path="perfil" element={<PerfilPage />} />
        </Route>

        {/* Admin */}
        <Route path="/admin" element={<AdminPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <DemoBanner />
      </ToastProvider>
    </AuthProvider>
  );
}

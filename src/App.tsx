import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import ToastContainer from './components/ToastContainer';
import InstallPrompt from './components/InstallPrompt';
import AppLayout from './components/AppLayout';
import { Heart } from 'lucide-react';

// Landing chargée normalement (première page vue par les visiteurs)
import Landing from './pages/Landing';

// Code splitting : toutes les autres pages sont chargées à la demande
const Register = lazy(() => import('./pages/Register'));
const Login = lazy(() => import('./pages/Login'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));
const AcceptInvite = lazy(() => import('./pages/AcceptInvite'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const MemoryDetail = lazy(() => import('./pages/MemoryDetail'));
const Account = lazy(() => import('./pages/Account'));
const Chat = lazy(() => import('./pages/Chat'));
const LoveNotes = lazy(() => import('./pages/LoveNotes'));
const Anniversaries = lazy(() => import('./pages/Anniversaries'));
const Stats = lazy(() => import('./pages/Stats'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));
const NotFound = lazy(() => import('./pages/NotFound'));

function PublicOnly({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (session) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-theme-pale">
      <Heart className="w-12 h-12 text-theme-primary animate-heartbeat mb-4" fill="currentColor" />
      <p className="text-theme-dark font-medium">Chargement…</p>
    </div>
  );
}

function AppRoutes() {
  const { loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth/register" element={<PublicOnly><Register /></PublicOnly>} />
          <Route path="/auth/login" element={<PublicOnly><Login /></PublicOnly>} />
          <Route path="/auth/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/reset-password" element={<ResetPassword />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/invite/:id" element={<AcceptInvite />} />
          <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
          <Route path="/memory/:id" element={<ProtectedRoute><AppLayout><MemoryDetail /></AppLayout></ProtectedRoute>} />
          <Route path="/account" element={<ProtectedRoute><AppLayout><Account /></AppLayout></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><AppLayout><Chat /></AppLayout></ProtectedRoute>} />
          <Route path="/love-notes" element={<ProtectedRoute><AppLayout><LoveNotes /></AppLayout></ProtectedRoute>} />
          <Route path="/anniversaries" element={<ProtectedRoute><AppLayout><Anniversaries /></AppLayout></ProtectedRoute>} />
          <Route path="/stats" element={<ProtectedRoute><AppLayout><Stats /></AppLayout></ProtectedRoute>} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <ToastContainer />
      <InstallPrompt />
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <AppRoutes />
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

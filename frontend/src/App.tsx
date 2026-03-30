import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Index from './pages/Index';
import SearchResults from './pages/SearchResults';
import PaperDetails from './pages/PaperDetails';
import Upload from './pages/Upload';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import Story from './pages/Story';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import AuthCallback from './pages/AuthCallback';
import AuthError from './pages/AuthError';
import LogoutCallbackPage from './pages/LogoutCallbackPage';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import NotFoundPage from './pages/NotFound';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/auth/error" element={<AuthError />} />
          <Route path="/auth/logout-callback" element={<LogoutCallbackPage />} />
          <Route path="/" element={<Layout><Index /></Layout>} />
          <Route path="/search" element={<Layout><SearchResults /></Layout>} />
          <Route path="/past-papers" element={<Layout><SearchResults /></Layout>} />
          <Route path="/study-resources" element={<Layout><Index /></Layout>} />
          <Route path="/story" element={<Layout><Story /></Layout>} />
          <Route path="/student-stories" element={<Layout><Story /></Layout>} />
          <Route path="/terms" element={<Layout><Terms /></Layout>} />
          <Route path="/privacy" element={<Layout><Privacy /></Layout>} />
          <Route path="/paper/:id" element={<Layout><PaperDetails /></Layout>} />
          <Route path="/upload" element={<Layout><Upload /></Layout>} />
          <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
          <Route path="/profile" element={<Layout><Profile /></Layout>} />
          <Route
            path="/admin"
            element={
              <ProtectedAdminRoute allowedRoles={['admin', 'content_manager']} title="management">
                <Layout>
                  <Admin />
                </Layout>
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/content-manager"
            element={
              <ProtectedAdminRoute allowedRoles={['admin', 'content_manager']} title="management">
                <Layout>
                  <Admin />
                </Layout>
              </ProtectedAdminRoute>
            }
          />
          <Route path="*" element={<Layout><NotFoundPage /></Layout>} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '../contexts/ThemeContext';
import { AuthProvider } from '../contexts/AuthContext';

import AuthLayout from './pages/common/auth/AuthLayout';
import Login from './pages/common/auth/pages/SignIn';
import Register from './pages/common/auth/pages/SignUp';
import OTPVerification from './pages/common/auth/pages/OTPVerification';
import ForgotPassword from './pages/common/auth/pages/ForgotPassword';
import ResetPassword from './pages/common/auth/pages/ResetPassword';

import ProtectedRoute from './components/ProtectedRoute';

import FocusSession from './pages/user/focus/FocusSession';
import DashboardNav from './pages/DashboardNav';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-email" element={<OTPVerification />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/" element={<Navigate to="/login" replace />} />
            </Route>
              <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardNav />} />
              <Route path="/focus-page" element={<FocusSession />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

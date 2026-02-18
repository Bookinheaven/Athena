import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider } from "../contexts/ThemeContext";
import { AuthProvider } from "../contexts/AuthContext";

import AuthLayout from "./pages/common/auth/AuthLayout";
import Login from "./pages/common/auth/pages/SignIn";
import Register from "./pages/common/auth/pages/SignUp";
import OTPVerification from "./pages/common/auth/pages/OTPVerification";
import ForgotPassword from "./pages/common/auth/pages/ForgotPassword";
import ResetPassword from "./pages/common/auth/pages/ResetPassword";

import ProtectedRoute from "./components/ProtectedRoute";

import FocusSession from "./pages/user/focus/FocusSession";
import Profile from "./pages/user/profile/Profile";
import Planner from "./pages/user/planner/Planner";
import UserLayout from "./pages/layouts/UserLayout";
import AdminLayout from "./pages/layouts/AdminLayout";
import UserDashboard from "./pages/user/dashboard/UserDashboard";
import AdminDashboard from "./pages/admin/dashboard/AdminDashboard";
import RoleRoute from "./components/RouteRole";

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
              <Route element={<UserLayout />}>
                <Route path="/dashboard" element={<UserDashboard />} />
                <Route path="/focus-page" element={<FocusSession />} />
                <Route path="/planner" element={<Planner />} />
                <Route path="/profile" element={<Profile />} />
              </Route>
              <Route element={<RoleRoute allowedRoles={["admin"]} />}>
                <Route element={<AdminLayout />}>
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                </Route>
              </Route>
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

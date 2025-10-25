import { useAuth } from "../../contexts/AuthContext";
import UserDashboard from "./user/dashboard/Dashboard";
import AdminDashboard from "./admin/dashboard/Dashboard";
import LoadingSpinner from "../components/LoadingSpinner/LoadingSpinner"; 
import { Navigate } from "react-router-dom";

export default function DashboardNav() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;

  if (!user) return <Navigate to="/login" replace />;

  if (user.type === "user") return <UserDashboard />;
  if (user.type === "admin") return <AdminDashboard />;

  return (<>NOT FOUND</>);
}

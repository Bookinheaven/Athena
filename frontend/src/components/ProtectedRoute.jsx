import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from "./LoadingSpinner/LoadingSpinner";
import UserMainLayout from '../pages/user/UserMainLayout';
import AdminMainLayout from '../pages/admin/AdminMainLayout';

const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return (
    <>
      {user.type === 'admin' ? (
        <AdminMainLayout>
          <Outlet />
        </AdminMainLayout>
      ) : (
        <UserMainLayout>
          <Outlet />
        </UserMainLayout>
      )}
    </>
  );
};

export default ProtectedRoute;

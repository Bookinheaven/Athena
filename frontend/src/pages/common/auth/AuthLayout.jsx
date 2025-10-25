import { Navigate, Outlet } from 'react-router-dom';
import ThemeToggle from '../../../components/ThemeToggle/ThemeToggle';
import { useAuth } from '../../../../contexts/AuthContext';

const AuthLayout = () => {
  const {user} = useAuth()
  if(user?._id) return <Navigate to="/dashboard" replace />
  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: 'var(--color-background-color)',
        color: 'var(--color-text-primary)',
      }}
    >
      <ThemeToggle />
      <Outlet /> 
    </div>
  );
};

export default AuthLayout;

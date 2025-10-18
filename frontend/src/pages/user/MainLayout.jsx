import { Outlet } from 'react-router-dom';
import ThemeToggle from '../../components/ThemeToggle/ThemeToggle';

const MainLayout = () => {
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

export default MainLayout;

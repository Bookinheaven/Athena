import { Outlet } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import HeaderNav from './components/HeaderNav';
const MainLayout = () => {
  return (
    <div className="flex flex-col items-center min-h-screen bg-background-primary text-text-primary">
      <HeaderNav />
      <main className="min-h-screen w-full h-full">
        <Toaster />
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;

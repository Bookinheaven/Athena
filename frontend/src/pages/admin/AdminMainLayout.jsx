import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

const AdminMainLayout = () => {
  return (
    <div className="flex flex-col items-center min-h-screen bg-background-primary text-text-primary">
      <main className="min-h-screen w-full h-full">
        <Toaster />
        <Outlet />
      </main>
    </div>
  );
};

export default AdminMainLayout;

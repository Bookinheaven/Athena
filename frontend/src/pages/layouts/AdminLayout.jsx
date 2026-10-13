import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

const AdminLayout = () => {
  return (
    <div className="flex-1 flex flex-col items-center bg-background text-foreground h-full overflow-hidden">
      <main className="w-full h-full flex flex-col overflow-hidden min-h-0">
        <Toaster
          toastOptions={{
            className: 'border border-border bg-card text-card-foreground shadow-lg text-xs font-medium rounded-lg',
          }}
        />
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;

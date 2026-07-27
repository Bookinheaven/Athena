import { Navigate, Outlet } from 'react-router-dom';
import ThemeToggle from '@/components/ThemeToggle/ThemeToggle';
import { useAuth } from '@contexts/AuthContext';
import { APP_CONFIG } from '@/config/branding';

const AuthLayout = () => {
  const { user } = useAuth();
  if (user?._id) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-full h-full w-full grid grid-cols-1 lg:grid-cols-12 bg-white dark:bg-[#0c0c0e] font-sans selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-neutral-900">
      
      {/* Left Column: Architectural Showcase & System Status (Hidden on Mobile, Visible on Desktop) */}
      <div className="hidden lg:flex lg:col-span-5 xl:col-span-6 flex-col justify-between p-10 xl:p-14 bg-[#09090b] text-white border-r border-neutral-800/80 relative overflow-hidden select-none">
        
        {/* Minimalist Geometric Grid Canvas */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
        
        {/* Top Brand Monogram */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white text-neutral-950 font-bold flex items-center justify-center text-sm tracking-tighter shadow-sm">
              {APP_CONFIG.logoLetter}
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm tracking-tight text-neutral-100">
                {APP_CONFIG.name}
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
                Desktop Edition {APP_CONFIG.version}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-neutral-900/80 border border-neutral-800 text-[11px] font-mono text-neutral-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Operational</span>
          </div>
        </div>

        {/* Center Pro-Tool Interactive Showcase */}
        <div className="relative z-10 my-auto max-w-md py-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-neutral-900 border border-neutral-800/80 text-xs font-mono text-neutral-400 mb-6">
            <span>⌘K</span>
            <span className="text-neutral-600">|</span>
            <span>Command Palette</span>
          </div>
          
          <h1 className="text-3xl xl:text-4xl font-semibold tracking-tight text-white leading-[1.15]">
            {APP_CONFIG.tagline}
          </h1>
          
          <p className="mt-4 text-sm leading-relaxed text-neutral-400">
            {APP_CONFIG.description}
          </p>

          {/* Minimalist Feature Metrics */}
          <div className="grid grid-cols-2 gap-6 mt-10 pt-8 border-t border-neutral-900 font-mono text-xs">
            <div>
              <div className="text-neutral-500 mb-1">LATENCY</div>
              <div className="text-lg font-semibold text-neutral-200">&lt; 16ms</div>
            </div>
            <div>
              <div className="text-neutral-500 mb-1">ENCRYPTION</div>
              <div className="text-lg font-semibold text-neutral-200">AES-256-GCM</div>
            </div>
          </div>
        </div>

        {/* Bottom Footer Details */}
        <div className="relative z-10 flex items-center justify-between text-xs text-neutral-500">
          <span>© {APP_CONFIG.year} {APP_CONFIG.company}</span>
          <div className="flex items-center gap-4 font-mono text-[11px]">
            <span>PRESS <kbd className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">?</kbd> FOR SHORTCUTS</span>
          </div>
        </div>
      </div>

      {/* Right Column: Form Workspace Area */}
      <div className="relative flex-1 lg:col-span-7 xl:col-span-6 flex flex-col justify-between p-6 sm:p-10 lg:p-14 min-h-full h-full overflow-y-auto bg-white dark:bg-[#0c0c0e]">
        
        {/* Mobile Header / Top Workspace Bar */}
        <header className="w-full flex items-center justify-between select-none z-20">
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold flex items-center justify-center text-sm tracking-tighter">
              {APP_CONFIG.logoLetter}
            </div>
            <span className="font-semibold text-base tracking-tight text-neutral-900 dark:text-white">
              {APP_CONFIG.shortName}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer" />
          </div>
        </header>

        {/* Center Auth Outlet (Form Screen) */}
        <main className="flex-1 flex items-center justify-center py-10 z-10">
          <div className="w-full max-w-sm mx-auto">
            <Outlet />
          </div>
        </main>

        {/* Minimal Workspace Footer */}
        <footer className="w-full text-center lg:text-left text-[11px] font-mono text-neutral-400 dark:text-neutral-600 select-none">
          <span>SECURED WORKSPACE SESSION</span>
        </footer>
      </div>

    </div>
  );
};

export default AuthLayout;

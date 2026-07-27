import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { APP_CONFIG } from '@/config/branding';

const Titlebar = () => {
    const [isMaximized, setIsMaximized] = useState(false);
    const [isDesktop, setIsDesktop] = useState(false);
    const location = useLocation();
    const { user } = useAuth();
    const isAuthPage = [
        "/login",
        "/register",
        "/verify-email",
        "/forgot-password",
        "/reset-password",
        "/",
    ].includes(location.pathname) || !user;

    useEffect(() => {
        // Check if running inside Electron
        if (typeof window !== 'undefined' && window.electronAPI) {
            setIsDesktop(true);
            window.electronAPI.isMaximized().then(setIsMaximized);

            const unsubscribe = window.electronAPI.onMaximizedChange((maximized) => {
                setIsMaximized(maximized);
            });

            return () => {
                if (unsubscribe) unsubscribe();
            };
        }
    }, []);

    if (!isDesktop) return null;

    const handleMinimize = () => window.electronAPI?.minimize();
    const handleMaximize = () => window.electronAPI?.maximize();
    const handleClose = () => window.electronAPI?.close();

    return (
        <div
            className="relative w-full h-9 bg-neutral-900 dark:bg-[#0a0a0c] border-b border-neutral-800/80 text-neutral-400 flex items-center justify-between px-3 select-none z-[9999] shrink-0 font-sans"
            style={{ WebkitAppRegion: 'drag' }}
        >
            {/* Left App Branding / Title Area */}
            <div className="flex items-center gap-2 text-xs font-medium tracking-tight text-neutral-300">
                <div className="w-4 h-4 rounded bg-white text-neutral-950 font-bold flex items-center justify-center text-[9px]">
                    {APP_CONFIG.logoLetter}
                </div>
                <span>{APP_CONFIG.name}</span>
            </div>

            {/* Middle Command Bar Button */}
            {!isAuthPage && (
                <div className="absolute left-1/2 -translate-x-1/2 flex items-center" style={{ WebkitAppRegion: 'no-drag' }}>
                    <button
                        type="button"
                        onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))}
                        className="hidden sm:flex items-center justify-between w-64 h-6 px-2.5 rounded-md bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700/60 text-[11px] text-neutral-400 hover:text-neutral-200 transition-all cursor-pointer shadow-xs group"
                    >
                        <div className="flex items-center gap-2 min-w-0">
                            <svg className="w-3 h-3 text-neutral-500 group-hover:text-neutral-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <span className="truncate">Search or command...</span>
                        </div>
                        <span className="text-[9px] bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-700/80 text-neutral-500 group-hover:text-neutral-300 font-mono shrink-0 ml-2">⌘K</span>
                    </button>
                </div>
            )}

            {/* Right Window Controls */}
            <div className="flex items-center -mr-3 h-full" style={{ WebkitAppRegion: 'no-drag' }}>
                <button
                    onClick={handleMinimize}
                    className="w-11 h-full flex items-center justify-center hover:bg-neutral-800/80 hover:text-white transition-colors cursor-pointer focus:outline-none"
                    aria-label="Minimize"
                >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 13H5" />
                    </svg>
                </button>

                <button
                    onClick={handleMaximize}
                    className="w-11 h-full flex items-center justify-center hover:bg-neutral-800/80 hover:text-white transition-colors cursor-pointer focus:outline-none"
                    aria-label={isMaximized ? "Restore" : "Maximize"}
                >
                    {isMaximized ? (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 8V4h12v12h-4M4 8h12v12H4V8z" />
                        </svg>
                    ) : (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <rect x="4" y="4" width="16" height="16" rx="1" strokeWidth={1.5} />
                        </svg>
                    )}
                </button>

                <button
                    onClick={handleClose}
                    className="w-12 h-full flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors cursor-pointer focus:outline-none"
                    aria-label="Close"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default Titlebar;

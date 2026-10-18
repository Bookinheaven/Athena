import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { MobileNav } from "./MobileNav";
import { TooltipProvider } from "@/components/ui/tooltip";

import { Toaster } from "react-hot-toast";

export const AppShell = ({ children }) => {
  const location = useLocation();
  const mainRef = React.useRef(null);

  // Smoothly reset scroll on page change
  React.useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex h-full w-full min-h-0 bg-background text-foreground overflow-hidden font-sans">
        {/* Global Toast Notifications */}
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            className: "border border-border bg-card text-card-foreground shadow-lg text-xs font-medium rounded-lg",
          }}
        />

        {/* Desktop / Tablet Sidebar (hidden on mobile) */}
        <Sidebar className="hidden lg:flex" />

        {/* Mobile Drawer Navigation Sheet */}
        <MobileNav />

        {/* Main Area: Topbar + Page Content */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          <Topbar />
          <main ref={mainRef} className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 scroll-smooth">
            <div
              key={location.pathname}
              className="animate-in fade-in-50 duration-200 min-h-full flex flex-col transition-all ease-out"
            >
              {children || <Outlet />}
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default AppShell;

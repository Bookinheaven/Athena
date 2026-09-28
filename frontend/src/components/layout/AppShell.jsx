import React from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { MobileNav } from "./MobileNav";
import { TooltipProvider } from "@/components/ui/tooltip";

export const AppShell = ({ children }) => {
  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex h-full w-full min-h-0 bg-background text-foreground overflow-hidden font-sans">
        {/* Desktop / Tablet Sidebar (hidden on mobile) */}
        <Sidebar className="hidden lg:flex" />

        {/* Mobile Drawer Navigation Sheet */}
        <MobileNav />

        {/* Main Area: Topbar + Page Content */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
            {children || <Outlet />}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default AppShell;

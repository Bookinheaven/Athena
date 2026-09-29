import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Target,
  History,
  TrendingUp,
  User,
  Settings,
} from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import { APP_CONFIG } from "@/config/branding";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Today" },
  { to: "/planner", icon: Calendar, label: "Plan" },
  { to: "/focus-page", icon: Target, label: "Focus" },
  { to: "/sessions", icon: History, label: "History" },
  { to: "/dashboard", icon: TrendingUp, label: "Insights" },
];

export const MobileNav = () => {
  const { mobileNavOpen, setMobileNavOpen } = useUIStore();
  const location = useLocation();

  const handleNavClick = () => {
    setMobileNavOpen(false);
  };

  return (
    <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
      <SheetContent side="left" className="w-64 p-0 flex flex-col bg-sidebar text-sidebar-foreground border-r-sidebar-border">
        {/* Brand Header */}
        <SheetHeader className="h-12 px-3 border-b border-sidebar-border flex flex-row items-center gap-2.5 space-y-0 text-left shrink-0">
          <div className="w-6.5 h-6.5 rounded-md bg-sidebar-primary text-sidebar-primary-foreground font-semibold flex items-center justify-center text-[11px] tracking-tight shrink-0">
            {APP_CONFIG.logoLetter}
          </div>
          <div className="flex flex-col">
            <SheetTitle className="text-xs font-semibold text-sidebar-foreground leading-none mt-1">
              {APP_CONFIG.name}
            </SheetTitle>
            <span className="text-[10px] text-sidebar-foreground/70 leading-none mt-1 font-normal">
              Workspace
            </span>
          </div>
        </SheetHeader>

        {/* Navigation list */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to;
            return (
              <NavLink
                key={label + to}
                to={to}
                onClick={handleNavClick}
                className={cn(
                  "flex items-center h-8.5 rounded-md px-2.5 text-[13px] transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground font-normal"
                )}
              >
                <Icon className="h-4 w-4 mr-2.5 shrink-0" />
                <span>{label}</span>
              </NavLink>
            );
          })}

          <div className="py-1.5">
            <Separator className="bg-sidebar-border" />
          </div>

          <NavLink
            to="/profile"
            onClick={handleNavClick}
            className={cn(
              "flex items-center h-8.5 rounded-md px-2.5 text-[13px] transition-colors",
              location.pathname === "/profile"
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground font-normal"
            )}
          >
            <User className="h-4 w-4 mr-2.5 shrink-0" />
            <span>Profile</span>
          </NavLink>

          <NavLink
            to="/settings"
            onClick={handleNavClick}
            className={cn(
              "flex items-center h-8.5 rounded-md px-2.5 text-[13px] transition-colors",
              location.pathname.startsWith("/settings")
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground font-normal"
            )}
          >
            <Settings className="h-4 w-4 mr-2.5 shrink-0" />
            <span>Settings</span>
          </NavLink>
        </nav>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNav;

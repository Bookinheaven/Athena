import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  Bell,
  User,
  Users,
  Palette,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useAuth } from "@contexts/AuthContext";
import { useMultiAccount } from "@contexts/MultiAccountContext";
import { useTheme } from "@contexts/ThemeContext";
import { useUIStore } from "@/stores/uiStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { APP_CONFIG } from "@/config/branding";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ConfirmModal } from "@/components/ConfirmModal";
import AccountSwitcherModal from "@/components/AccountSwitcherModal";

const ROUTE_TITLES = {
  "/dashboard": "Today",
  "/planner": "Planner",
  "/focus-page": "Focus",
  "/sessions": "History",
  "/profile": "Settings",
  "/admin/dashboard": "Admin",
};

export const Topbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { clearAccountToken } = useMultiAccount();
  const { setShowThemeModal } = useTheme();
  const { sidebarCollapsed, toggleSidebarCollapsed, toggleMobileNav } =
    useUIStore();
  const { unreadCount } = useNotificationStore();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showSwitcherModal, setShowSwitcherModal] = useState(false);

  const currentTitle = ROUTE_TITLES[location.pathname] || "Athena";

  const handleLogoutConfirm = async () => {
    try {
      const userId = user?._id || user?.id;
      await logout();
      if (userId) {
        clearAccountToken(userId);
      }
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setShowLogoutModal(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="h-12 border-b border-sidebar-border bg-sidebar text-sidebar-foreground flex items-center justify-between px-4 sm:px-6 shrink-0 z-20 select-none transition-colors">
      {/* Left: Sidebar Toggle (Desktop) / Drawer Menu (Mobile) + Current Page Title */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Mobile Navigation Drawer Toggle */}
        <button
          onClick={toggleMobileNav}
          className="lg:hidden p-1.5 -ml-1 rounded-md text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1.5 focus-visible:ring-sidebar-ring"
          aria-label="Open navigation menu"
        >
          <Menu className="h-4 w-4" />
        </button>

        {/* Desktop Sidebar Collapse/Expand Toggle */}
        <Tooltip>
          <TooltipTrigger
            onClick={toggleSidebarCollapsed}
            className="hidden lg:inline-flex items-center justify-center p-1.5 -ml-1 rounded-md text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1.5 focus-visible:ring-sidebar-ring"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          </TooltipContent>
        </Tooltip>

        <span className="text-xs font-semibold text-sidebar-foreground tracking-tight select-none ml-1">
          {currentTitle}
        </span>
      </div>

      {/* Right: Notifications & Account Dropdown */}
      <div className="flex items-center gap-1.5">
        {/* Notifications Icon Button */}
        <button
          aria-label="Notifications"
          className="relative p-1.5 rounded-md text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors cursor-pointer"
        >
          <Bell className="h-3.5 w-3.5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />
          )}
        </button>

        {/* User Avatar & Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex items-center p-0.5 rounded-full hover:ring-2 hover:ring-sidebar-ring/40 transition-all outline-none cursor-pointer"
            aria-label="User account menu"
          >
            <Avatar className="h-7 w-7 border border-sidebar-border/60 bg-sidebar-accent">
              <AvatarImage src={user?.avatar} alt={user?.fullName || "User"} />
              <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground font-semibold text-[10px]">
                {getInitials(user?.fullName || user?.username)}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-0.5">
                <p className="text-xs font-medium text-foreground truncate leading-tight">
                  {user?.fullName || user?.username || "Account"}
                </p>
                <p className="text-[11px] text-muted-foreground truncate leading-tight">
                  {user?.email || "user@workspace"}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => navigate("/profile")}>
              <User className="mr-2 h-3.5 w-3.5" />
              <span>Settings</span>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => setShowSwitcherModal(true)}>
              <Users className="mr-2 h-3.5 w-3.5" />
              <span>Work Accounts</span>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => setShowThemeModal(true)}>
              <Palette className="mr-2 h-3.5 w-3.5" />
              <span>Theme</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => setShowLogoutModal(true)}
              variant="destructive"
            >
              <LogOut className="mr-2 h-3.5 w-3.5" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Account Switcher and Logout Modals */}
      <ConfirmModal
        isOpen={showLogoutModal}
        title={`Logout ${APP_CONFIG.shortName}`}
        message="Are you sure you want to log out? Any unsaved focus session progress might be lost."
        onConfirm={handleLogoutConfirm}
        onCancel={() => setShowLogoutModal(false)}
        type="danger"
      />

      <AccountSwitcherModal
        isOpen={showSwitcherModal}
        onClose={() => setShowSwitcherModal(false)}
      />
    </header>
  );
};

export default Topbar;

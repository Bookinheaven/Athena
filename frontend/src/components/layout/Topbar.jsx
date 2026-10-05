import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  User,
  Settings as SettingsIcon,
  Users,
  Palette,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Command,
} from "lucide-react";
import { useAuth } from "@contexts/AuthContext";
import { useMultiAccount } from "@contexts/MultiAccountContext";
import { useTheme } from "@contexts/ThemeContext";
import { useUIStore } from "@/stores/uiStore";
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
  "/profile": "Profile",
  "/settings": "Settings",
  "/admin/dashboard": "Admin",
};

const getInitials = (name) => {
  if (!name) return "U";
  return name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2);
};

const IconButton = ({ onClick, label, children, badge }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <button
        onClick={onClick}
        aria-label={label}
        className="relative p-1.5 rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sidebar-ring"
      >
        {children}
        {badge && (
          <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-destructive ring-1 ring-sidebar" />
        )}
      </button>
    </TooltipTrigger>
    <TooltipContent side="bottom" className="text-xs font-medium">
      {label}
    </TooltipContent>
  </Tooltip>
);

export const Topbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { clearAccountToken } = useMultiAccount();
  const { setShowThemeModal } = useTheme();
  const { sidebarCollapsed, toggleSidebarCollapsed, toggleMobileNav } = useUIStore();
  const userId = user?.id;

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showSwitcherModal, setShowSwitcherModal] = useState(false);

  const currentTitle =
    ROUTE_TITLES[location.pathname] ||
    (location.pathname.startsWith("/settings") ? "Settings" : "Athena");

  const handleLogoutConfirm = async () => {
    try {
      await logout();
      if (userId) clearAccountToken(userId);
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setShowLogoutModal(false);
    }
  };

  const openCommandPalette = () =>
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }));

  return (
    <header className="h-12 border-b border-sidebar-border bg-sidebar text-sidebar-foreground flex items-center justify-between px-3 sm:px-4 shrink-0 z-20 select-none transition-colors">
      {/* Left: sidebar toggle + page breadcrumb */}
      <div className="flex items-center gap-1">
        {/* Mobile menu button */}
        <button
          onClick={toggleMobileNav}
          className="lg:hidden p-1.5 -ml-0.5 rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sidebar-ring"
          aria-label="Open navigation menu"
        >
          <Menu className="h-4 w-4" />
        </button>

        {/* Desktop sidebar collapse toggle */}
        <Tooltip>
          <TooltipTrigger
            onClick={() => toggleSidebarCollapsed(userId)}
            className="hidden lg:inline-flex items-center justify-center p-1.5 -ml-0.5 rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sidebar-ring"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs font-medium">
            {sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          </TooltipContent>
        </Tooltip>

        {/* Divider */}
        <span className="hidden lg:block h-4 w-px bg-sidebar-border/70 mx-1" />

        {/* Page title */}
        <span className="text-[13px] font-semibold text-sidebar-foreground tracking-tight">
          {currentTitle}
        </span>
      </div>

      {/* Right: action icons + account dropdown */}
      <div className="flex items-center gap-0.5">
        {/* Command palette */}
        <IconButton onClick={openCommandPalette} label="Command palette (⌘K)">
          <Command className="h-3.5 w-3.5" />
        </IconButton>

        {/* Theme picker */}
        <IconButton onClick={() => setShowThemeModal(true)} label="Theme">
          <Palette className="h-3.5 w-3.5" />
        </IconButton>

        {/* Thin divider before avatar */}
        <span className="h-4 w-px bg-sidebar-border/70 mx-1" />

        {/* Account dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex items-center gap-2 pl-0.5 pr-1.5 py-1 rounded-lg hover:bg-sidebar-accent/60 transition-colors outline-none cursor-pointer group"
            aria-label="User account menu"
          >
            <Avatar className="h-6 w-6 border border-sidebar-border/60 bg-sidebar-accent shrink-0">
              <AvatarImage src={user?.avatar} alt={user?.fullName || "User"} />
              <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground font-semibold text-[9px]">
                {getInitials(user?.fullName || user?.username)}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:block text-[12px] font-medium text-sidebar-foreground/80 group-hover:text-sidebar-foreground transition-colors max-w-[90px] truncate leading-none">
              {user?.fullName?.split(" ")[0] || user?.username || "Account"}
            </span>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            {/* User identity */}
            <DropdownMenuLabel className="font-normal pb-2">
              <div className="flex items-center gap-2.5">
                <Avatar className="h-8 w-8 border border-border/60 bg-secondary shrink-0">
                  <AvatarImage src={user?.avatar} alt={user?.fullName || "User"} />
                  <AvatarFallback className="bg-secondary text-secondary-foreground font-semibold text-[11px]">
                    {getInitials(user?.fullName || user?.username)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate leading-tight">
                    {user?.fullName || user?.username || "Account"}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">
                    {user?.email || "user@workspace"}
                  </p>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => navigate("/profile")}>
              <User className="mr-2 h-3.5 w-3.5" />
              <span>Profile</span>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <SettingsIcon className="mr-2 h-3.5 w-3.5" />
              <span>Settings</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => setShowSwitcherModal(true)}>
              <Users className="mr-2 h-3.5 w-3.5" />
              <span>Switch Account</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => setShowLogoutModal(true)} variant="destructive">
              <LogOut className="mr-2 h-3.5 w-3.5" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

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

import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Target,
  Calendar,
  User,
  ChevronRight,
  LogOut,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "../../../../contexts/AuthContext";
import { ConfirmModal } from "../../../components/ConfirmModal";
import { useState } from "react";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/focus-page", icon: Target, label: "Quick Focus" },
  { to: "/planner", icon: Calendar, label: "Planner" },
  { to: "/profile", icon: User, label: "Profile" },
];

const Sidebar = ({ expanded, setExpanded }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false); 

  const handleLogoutConfirm = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setShowLogoutModal(false);
    }
  };

  return (
    <>
      <aside
        className={`
          fixed left-0 top-0 h-full z-50 flex flex-col
          transition-[width] duration-300 ease-in-out will-change-[width] transform-gpu
          ${expanded ? "w-64" : "w-20"}
          bg-card-background/95 backdrop-blur-xl 
          border-r border-border-primary/40
          shadow-xl shadow-black/20
          overflow-hidden
        `}
      >
        <div className="h-20 flex items-center justify-center border-b border-border-primary/30 relative overflow-hidden shrink-0">
          <span
            className={`
              absolute font-semibold text-lg tracking-wide text-text-primary
              transition-all duration-300 ease-in-out
              ${expanded ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4 scale-95"}
            `}
          >
            Athena
          </span>
          <span
            className={`
              absolute font-bold text-xl text-brand-500
              transition-all duration-300 ease-in-out
              ${expanded ? "opacity-0 -translate-x-4 scale-95" : "opacity-100 translate-x-0"}
            `}
          >
            A
          </span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 flex flex-col justify-center overflow-y-auto custom-scrollbar">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} title={!expanded ? label : ""}>
              {({ isActive }) => (
                <div
                  className={`
                    group relative flex items-center h-12 rounded-xl px-3
                    transition-all duration-200
                    ${isActive
                        ? "bg-brand-500/10 text-text-primary"
                        : "text-text-muted hover:text-text-primary hover:bg-brand-500/5"
                    }
                  `}
                >
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-[3px] bg-brand-500 rounded-r-full shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                  )}
                  <Icon
                    size={24}
                    className={`
                      flex-shrink-0 transition-transform duration-300 ease-in-out
                      ${isActive ? "text-brand-500 scale-110" : "group-hover:scale-110"}
                    `}
                  />

                  <span
                    className={`
                      whitespace-nowrap text-sm font-medium
                      transition-all duration-300 ease-in-out overflow-hidden
                      ${expanded ? "max-w-[130px] opacity-100 translate-x-3" : "max-w-0 opacity-0 translate-x-0"}
                    `}
                  >
                    {label}
                  </span>
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto flex flex-col items-start justify-center p-4 gap-3 shrink-0">
          <ThemeToggle expanded={expanded} />
          
          <button
            onClick={() => setShowLogoutModal(true)}
            title={!expanded ? "Logout" : ""}
            className={`
              relative flex items-center h-12 rounded-xl px-3
              transition-all duration-200
              bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white 
              focus:outline-none overflow-hidden
              ${expanded ? "w-full" : "w-12"}
            `}
          >
            <LogOut size={24} className="flex-shrink-0 transition-transform duration-300 hover:scale-110" />
            
            <span
              className={`
                whitespace-nowrap text-sm font-medium
                transition-all duration-300 ease-in-out overflow-hidden
                ${expanded ? "max-w-[100px] opacity-100 translate-x-3" : "max-w-0 opacity-0 translate-x-0"}
              `}
            >
              Logout
            </span>
          </button>
        </div>

        <div className="h-16 w-full border-t border-border-primary/40 shrink-0">
          <button
            onClick={() => setExpanded((prev) => !prev)}
            className="
              w-full h-full flex items-center justify-center
              text-text-muted hover:text-text-primary hover:bg-brand-500/5
              transition-colors duration-200 focus:outline-none
            "
          >
            <ChevronRight
              className={`w-6 h-6 transition-transform duration-500 transform-gpu ${
                expanded ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      </aside>

      <ConfirmModal
        isOpen={showLogoutModal}
        title="Logout Athena"
        message="Are you sure you want to log out? Any unsaved focus session progress might be lost."
        onConfirm={handleLogoutConfirm}
        onCancel={() => setShowLogoutModal(false)}
        type="danger"
      />
    </>
  );
};

export default Sidebar;
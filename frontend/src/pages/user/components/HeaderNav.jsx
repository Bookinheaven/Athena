import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../../../contexts/AuthContext";
import ThemeToggle from "../components/ThemeToggle";
import { LogOut, LayoutDashboard, Target } from "lucide-react";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/focus-page", icon: Target, label: "Focus" },
];

export default function HeaderNav() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [time, setTime] = useState(new Date());

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 80) { 
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true }); 
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000); 
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      className={`fixed top-4 left-1/2 z-50 flex -translate-x-1/2 transform items-center justify-between rounded-full border border-border-primary/50 bg-card-background/70 px-4 py-2 shadow-lg shadow-shadow-primary/30 backdrop-blur-lg transition-all duration-300 ease-in-out w-[90%] md:w-[60%] lg:w-[40%] xl:w-[30%] bg-clip-text ${isVisible ? "translate-y-0 opacity-100" : "-translate-y-16 opacity-0"}`}
    >
      <nav className="flex items-center gap-4 border-r border-border-primary/50 pr-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            title={label}
            className={({ isActive }) =>
              `relative flex items-center justify-center rounded-full p-2 transition-all duration-200 ease-in-out group focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card-background
              ${
                isActive
                  ? "bg-accent-primary/20 text-accent-primary scale-105" 
                  : "text-text-muted hover:text-accent-primary hover:bg-white/5" 
              }
            `
            }
          >
            <Icon className="h-5 w-5" />
          </NavLink>
        ))}
      </nav>

      <div className="px-4 text-xl font-medium text-text-secondary tabular-nums">
        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>

      <div className="flex items-center gap-3 border-l border-border-primary/50 pl-3">
        <ThemeToggle />
        <button
          onClick={handleLogout}
          title="Logout"
          className="
            flex h-8 w-8 items-center justify-center rounded-full
            bg-red-500/30 text-red-400
            transition-all duration-300 ease-in-out
            hover:scale-110 hover:bg-red-500 hover:text-white 
            focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500 focus-visible:ring-offset-card-background
          "
          aria-label="Logout" 
        >
          <LogOut className="h-4 w-4" /> 
        </button>
      </div>
    </header>
  );
}
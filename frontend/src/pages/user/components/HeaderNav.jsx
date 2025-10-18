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
      if (window.scrollY > lastScrollY && window.scrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll);
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
      className={`
        fixed top-4 z-50 flex items-center justify-between
        py-1 rounded-2xl lg:w-[20%] pr-10 pl-4
        bg-card-background/80 backdrop-blur-md border border-border-primary
        shadow-lg shadow-shadow-primary hover:shadow-shadow-hover
        transition-all duration-500 ease-in-out
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-10"}
      `}
    >
      <nav className="flex items-center gap-6 flex-grow">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            title={label}
            className={({ isActive }) =>
              `flex flex-col items-center text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "text-accent-primary scale-110"
                  : "text-text-muted hover:text-accent-primary"
              }`
            }
          >
            <Icon className="w-5 h-5 mb-1" />
          </NavLink>
        ))}
      </nav>

      <div className="px-4 text-sm font-medium text-text-secondary">
        {time.toLocaleTimeString()}
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        <button
          onClick={handleLogout}
          title="Logout"
          className="
            flex items-center justify-center
            p-2 rounded-full
            bg-red-500/80 hover:bg-red-500
            text-white
            transition-all duration-300
            hover:scale-110 focus:outline-none
            focus:ring-2 focus:ring-offset-2 focus:ring-red-400
          "
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}

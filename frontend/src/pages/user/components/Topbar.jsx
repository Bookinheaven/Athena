import { useEffect, useState } from "react";
import ThemeToggle from "../components/ThemeToggle";
import { LogOut } from "lucide-react";
import { useAuth } from "../../../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Topbar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border-primary bg-card-background">
      <div className="text-lg font-medium tabular-nums">
        {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle />
        <button onClick={handleLogout}>
          <LogOut className="w-5 h-5 text-red-400 hover:text-red-500" />
        </button>
      </div>
    </header>
  );
};

export default Topbar;

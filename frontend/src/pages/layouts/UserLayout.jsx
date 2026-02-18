import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../user/components/Sidebar";
import { useState } from "react";

const UserLayout = () => {
  const location = useLocation();
  const isFocusPage = location.pathname.includes("focus");
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex min-h-screen bg-background-color text-text-primary overflow-x-hidden">
      <Sidebar expanded={expanded} setExpanded={setExpanded} />

      <main
        className={`
          flex-1 transition-all duration-300
          ${expanded ? "ml-56" : "ml-20"}
        `}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default UserLayout;

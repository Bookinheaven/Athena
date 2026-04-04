import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../user/components/Sidebar";
import { useState } from "react";

const UserLayout = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex h-screen bg-background-color text-text-primary overflow-hidden">
      
      <Sidebar expanded={expanded} setExpanded={setExpanded} />

      <main className={`flex-1 transition-[margin] duration-300 ease-in-out h-full overflow-y-auto overflow-x-hidden ${expanded ? "ml-64" : "ml-20"}`}>
        <Outlet />
      </main>
    </div>
  );
};

export default UserLayout;
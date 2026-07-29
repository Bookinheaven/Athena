import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../user/components/Sidebar";
import { useState } from "react";

const UserLayout = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex h-full min-h-0 w-full flex-1 bg-background-color text-text-primary overflow-hidden">
      <Sidebar expanded={expanded} setExpanded={setExpanded} />
      <main className="flex-1 transition-all duration-300 ease-in-out h-full overflow-y-auto overflow-x-hidden min-w-0">
        <Outlet />
      </main>
    </div>
  );
};

export default UserLayout;
import { useLocation } from "react-router-dom";
import { useAuth } from "@contexts/AuthContext";
import { AppShell } from "@/components/layout";
import { FocusProvider } from "@/features/focus";

const UserLayout = () => {
  const location = useLocation();
  const { user } = useAuth();
  const userId = user?._id || user?.id;

  return (
    <FocusProvider key={userId || "anonymous"} initialContext={location.state || null}>
      <AppShell />
    </FocusProvider>
  );
};

export default UserLayout;
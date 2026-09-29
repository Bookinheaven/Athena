import { useLocation } from "react-router-dom";
import { AppShell } from "@/components/layout";
import { FocusProvider } from "@/features/focus";

const UserLayout = () => {
  const location = useLocation();
  return (
    <FocusProvider initialContext={location.state || null}>
      <AppShell />
    </FocusProvider>
  );
};

export default UserLayout;
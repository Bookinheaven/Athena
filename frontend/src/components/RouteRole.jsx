import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const RoleRoute = ({ allowedRoles = [] }) => {
  const { user, loading, refreshUser } = useAuth();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const verifyRole = async () => {
      const currentRole = user?.accountType || user?.type;
      // If current role is already allowed, no need to refresh
      if (currentRole && allowedRoles.includes(currentRole)) {
        if (isMounted) setIsChecking(false);
        return;
      }

      // If user exists but role not in allowedRoles, attempt one fresh check against backend
      if (user && refreshUser) {
        try {
          const freshUser = await refreshUser();
          const freshRole = freshUser?.accountType || freshUser?.type;
          if (isMounted) setIsChecking(false);
          return;
        } catch {
          // ignore
        }
      }

      if (isMounted) setIsChecking(false);
    };

    if (!loading) {
      verifyRole();
    }

    return () => {
      isMounted = false;
    };
  }, [user, loading, allowedRoles, refreshUser]);

  if (loading || isChecking) return null;

  const effectiveRole = user?.accountType || user?.type;
  if (!effectiveRole || !allowedRoles.includes(effectiveRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default RoleRoute;

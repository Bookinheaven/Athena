import React, { useState } from "react";
import { LogOut, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useAuth } from "@contexts/AuthContext";
import { useMultiAccount } from "@contexts/MultiAccountContext";
import { useNavigate } from "react-router-dom";
import { APP_CONFIG } from "@/config/branding";

export const AccountActionsSection = ({ user }) => {
  const { logout } = useAuth();
  const { clearAccountToken } = useMultiAccount();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = async () => {
    try {
      const userId = user?._id || user?.id;
      await logout();
      if (userId) {
        clearAccountToken(userId);
      }
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setShowLogoutModal(false);
    }
  };

  return (
    <>
      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-xs space-y-4">
        <h2 className="text-base font-semibold text-foreground tracking-tight">
          Account Actions
        </h2>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-1">
          <div className="space-y-0.5">
            <p className="text-xs font-medium text-foreground">Sign out of this session</p>
            <p className="text-[11px] text-muted-foreground">
              Safely terminates your current authentication session on this device.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLogoutModal(true)}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive border-border shrink-0 cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5 mr-1.5" />
            Sign Out
          </Button>
        </div>

        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/40 border border-border/40 text-[11px] text-muted-foreground">
          <Info className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground/80" />
          <span>
            Username and email changes require multi-factor identity verification and will be available in an upcoming security release.
          </span>
        </div>
      </div>

      <ConfirmModal
        isOpen={showLogoutModal}
        title={`Sign out of ${APP_CONFIG.shortName}`}
        message="Are you sure you want to sign out? Any unsaved progress will be discarded."
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutModal(false)}
        type="danger"
      />
    </>
  );
};

export default AccountActionsSection;

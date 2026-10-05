import React, { useState } from "react";
import { BadgeCheck, ShieldCheck, Pencil, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProfileEditDialog from "./ProfileEditDialog";

export const ProfileHeader = ({ user, onUserUpdated }) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  if (!user) return null;

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const initials = getInitials(user.fullName || user.username);
  const userIdDisplay = user.id;

  return (
    <>
      <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Deterministic Avatar */}
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.fullName}
                className="w-20 h-20 rounded-2xl border border-border/80 object-cover shadow-xs shrink-0"
              />
            ) : (
              <div
                className="w-20 h-20 rounded-2xl border border-border/80 bg-linear-to-br from-neutral-800 to-neutral-950 dark:from-neutral-900 dark:to-black text-white flex items-center justify-center font-bold text-2xl tracking-tight shadow-xs shrink-0 select-none"
                aria-label={`Avatar initials for ${user.fullName}`}
              >
                {initials}
              </div>
            )}

            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground tracking-tight">
                  {user.fullName}
                </h1>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setIsEditDialogOpen(true)}
                  className="text-muted-foreground hover:text-foreground h-7 w-7 rounded-md cursor-pointer"
                  title="Edit full name"
                  aria-label="Edit full name"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </div>

              <p className="text-muted-foreground font-mono text-xs">
                @{user.username}
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-secondary text-secondary-foreground border border-border/50 text-[11px] font-mono font-medium">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      user.isEmailVerified ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                    }`}
                  />
                  <span>{user.isEmailVerified ? "Verified Email" : "Unverified"}</span>
                </span>

                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-secondary text-secondary-foreground border border-border/50 text-[11px] font-mono font-medium">
                  <ShieldCheck size={12} className="text-muted-foreground" />
                  <span>{user.isActive ? "Active Account" : "Inactive"}</span>
                </span>

                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-secondary text-secondary-foreground border border-border/50 text-[11px] font-mono font-medium uppercase text-[10px]">
                  <span>{user.type || "Standard"}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center font-mono text-xs text-muted-foreground border border-border/60 px-3 py-1.5 rounded-lg bg-muted/40">
            <span>ID:</span>
            <span className="text-foreground font-semibold select-all">
              {userIdDisplay ? userIdDisplay.slice(-8).toUpperCase() : "STANDARD"}
            </span>
          </div>
        </div>
      </div>

      <ProfileEditDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        currentName={user.fullName}
        onUpdated={onUserUpdated}
      />
    </>
  );
};

export default ProfileHeader;

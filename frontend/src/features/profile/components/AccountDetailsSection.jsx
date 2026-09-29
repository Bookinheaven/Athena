import React from "react";
import {
  User,
  UserCog,
  Mail,
  ShieldCheck,
  CalendarDays,
  Clock3,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export const AccountDetailsSection = ({ user }) => {
  if (!user) return null;

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Account Specifications */}
      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-xs space-y-4">
        <h2 className="text-base font-semibold text-foreground tracking-tight">
          Account Information
        </h2>

        <div className="divide-y divide-border/40">
          <InfoRow icon={<User size={14} />} label="Full Name" value={user.fullName} />
          <InfoRow icon={<UserCog size={14} />} label="Username" value={`@${user.username}`} />
          <InfoRow icon={<Mail size={14} />} label="Email" value={user.email} />
          <InfoRow icon={<ShieldCheck size={14} />} label="Account Type" value={user.type || "Standard"} />
        </div>
      </div>

      {/* Activity & History */}
      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-xs space-y-4">
        <h2 className="text-base font-semibold text-foreground tracking-tight">
          Activity & Timestamps
        </h2>

        <div className="divide-y divide-border/40">
          <InfoRow
            icon={<CalendarDays size={14} />}
            label="Member Since"
            value={formatDate(user.createdAt)}
          />
          <InfoRow
            icon={<Clock3 size={14} />}
            label="Last Login"
            value={formatDateTime(user.lastLogin)}
          />
          <InfoRow
            icon={<Clock3 size={14} />}
            label="Last Updated"
            value={formatDateTime(user.updatedAt || user.createdAt)}
          />
        </div>
      </div>
    </div>
  );
};

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex justify-between items-center py-3 text-xs font-mono first:pt-1 last:pb-1">
      <div className="flex items-center gap-2.5 text-muted-foreground">
        <span className="text-muted-foreground/80">{icon}</span>
        <span>{label}</span>
      </div>

      <span className="font-semibold text-foreground select-all">
        {value}
      </span>
    </div>
  );
}

export default AccountDetailsSection;

import { useAuth } from "../../../../contexts/AuthContext";
import { useTheme } from "../../../../contexts/ThemeContext";
import {
  BadgeCheck,
  CalendarDays,
  Clock3,
  Mail,
  ShieldCheck,
  User,
  UserCog,
  CheckCircle2,
  AlertCircle,
  Palette,
  Sparkles,
  Check,
} from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  const { theme, setTheme, availableThemes } = useTheme();

  if (!user) return null;

  const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=18181b&color=fff&size=256`;

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const formatDateTime = (date) =>
    new Date(date).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  return (
    <div className="min-h-screen bg-neutral-50/50 dark:bg-[#09090b] py-10 px-4 sm:px-6 lg:px-8 font-sans select-none">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* 1. Profile Header Card */}
        <div className="rounded-2xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121216] p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <img
                src={avatar}
                alt="Avatar"
                className="w-20 h-20 rounded-2xl border border-neutral-200 dark:border-white/10 shadow-sm shrink-0"
              />

              <div>
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
                  {user.fullName}
                </h1>

                <p className="text-neutral-500 dark:text-neutral-400 font-mono text-xs mt-0.5">
                  @{user.username}
                </p>

                <div className="flex flex-wrap items-center gap-2 mt-3.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-white/[0.06] text-neutral-700 dark:text-neutral-300 border border-neutral-200/80 dark:border-white/10 text-[11px] font-mono font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Verified Email</span>
                  </span>

                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-white/[0.06] text-neutral-700 dark:text-neutral-300 border border-neutral-200/80 dark:border-white/10 text-[11px] font-mono font-medium">
                    <ShieldCheck size={13} className="text-neutral-500 dark:text-neutral-400" />
                    <span>{user.isActive ? "Active Account" : "Inactive"}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center font-mono text-xs text-neutral-400 dark:text-neutral-500 border border-neutral-200 dark:border-white/10 px-3 py-1.5 rounded-lg bg-neutral-50 dark:bg-white/[0.02]">
              <span>ID:</span>
              <span className="text-neutral-700 dark:text-neutral-300 font-semibold select-all">
                {user._id ? user._id.slice(-8).toUpperCase() : "STANDARD"}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Specifications Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Account Information */}
          <div className="rounded-2xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121216] p-6 shadow-sm">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white mb-4 tracking-tight">
              Account Information
            </h2>

            <div className="divide-y divide-neutral-100 dark:divide-white/[0.06]">
              <InfoRow
                icon={<User size={15} />}
                label="Full Name"
                value={user.fullName}
              />
              <InfoRow
                icon={<UserCog size={15} />}
                label="Username"
                value={user.username}
              />
              <InfoRow
                icon={<Mail size={15} />}
                label="Email"
                value={user.email}
              />
              <InfoRow
                icon={<ShieldCheck size={15} />}
                label="Account Type"
                value={user.type || "Standard"}
              />
            </div>
          </div>

          {/* Account Activity */}
          <div className="rounded-2xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121216] p-6 shadow-sm">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white mb-4 tracking-tight">
              Activity & Timestamps
            </h2>

            <div className="divide-y divide-neutral-100 dark:divide-white/[0.06]">
              <InfoRow
                icon={<CalendarDays size={15} />}
                label="Member Since"
                value={formatDate(user.createdAt)}
              />
              <InfoRow
                icon={<Clock3 size={15} />}
                label="Last Login"
                value={formatDateTime(user.lastLogin || new Date())}
              />
              <InfoRow
                icon={<Clock3 size={15} />}
                label="Last Updated"
                value={formatDateTime(user.updatedAt || new Date())}
              />
            </div>
          </div>
        </div>

        {/* 3. Security Status Table */}
        <div className="rounded-2xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121216] p-6 shadow-sm">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-white mb-4 tracking-tight">
            Security Specification
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <StatusCard
              title="Email Verification"
              value={user.isEmailVerified ? "Verified" : "Unverified"}
              success={user.isEmailVerified !== false}
            />
            <StatusCard
              title="Account Status"
              value={user.isActive ? "Operational" : "Restricted"}
              success={user.isActive}
            />
          </div>
        </div>

        {/* 3. Appearance & Themes Card */}
        <div className="rounded-2xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121216] p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Palette size={18} className="text-neutral-500 dark:text-neutral-400" />
              <h2 className="text-base font-semibold text-neutral-900 dark:text-white tracking-tight">
                Appearance & Workspace Themes
              </h2>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-[10px] font-mono font-semibold uppercase">
              <Sparkles size={11} /> PRO Unlocked
            </span>
          </div>

          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono mb-6">
            Choose from tailored developer color palettes. (Premium options unlocked for preview)
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {availableThemes?.map((item) => {
              const isSelected = theme === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setTheme(item.id)}
                  className={`group relative p-4 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between gap-4 ${isSelected
                    ? "bg-neutral-50 dark:bg-white/[0.04] border-neutral-900 dark:border-white shadow-sm scale-[1.01]"
                    : "bg-white dark:bg-[#121216] border-neutral-200 dark:border-white/10 hover:border-neutral-400 dark:hover:border-white/30"
                    }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-lg border border-neutral-300 dark:border-white/20 flex items-center justify-center shrink-0 shadow-2xs relative overflow-hidden"
                        style={{ backgroundColor: item.color }}
                      >
                        <div
                          className="absolute bottom-0 right-0 w-4 h-4 rounded-tl-full"
                          style={{ backgroundColor: item.accent }}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-bold text-neutral-900 dark:text-white leading-tight">
                            {item.name}
                          </h3>
                          {item.isPremium && (
                            <span className="text-[9px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-1.5 py-0.2 rounded">
                              PRO 👑
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 leading-snug">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${isSelected
                        ? "bg-neutral-900 dark:bg-white border-neutral-900 dark:border-white text-white dark:text-neutral-900"
                        : "border-neutral-300 dark:border-neutral-700 group-hover:border-neutral-400 dark:group-hover:border-neutral-500"
                        }`}
                    >
                      {isSelected && <Check size={12} className="stroke-[3px]" />}
                    </div>
                  </div>
                  <div className="h-6 w-full rounded-md border border-neutral-200/60 dark:border-white/10 flex items-center px-2 gap-1.5 overflow-hidden" style={{ backgroundColor: item.color }}>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.accent }} />
                    <div className="h-1.5 w-12 rounded-full bg-neutral-300/40 dark:bg-white/10" />
                    <div className="h-1.5 w-6 rounded-full bg-neutral-300/40 dark:bg-white/10 ml-auto" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex justify-between items-center py-3.5 text-xs font-mono first:pt-1 last:pb-1">
      <div className="flex items-center gap-2.5 text-neutral-500 dark:text-neutral-400">
        <span className="text-neutral-400 dark:text-neutral-500">{icon}</span>
        <span>{label}</span>
      </div>

      <span className="font-semibold text-neutral-900 dark:text-white select-all">
        {value}
      </span>
    </div>
  );
}

function StatusCard({ title, value, success }) {
  return (
    <div className="p-4 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50/50 dark:bg-white/[0.02] flex items-center justify-between">
      <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
        {title}
      </span>

      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-mono font-medium ${success
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
          : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
          }`}
      >
        {success ? (
          <CheckCircle2 size={13} className="text-emerald-500" />
        ) : (
          <AlertCircle size={13} className="text-red-500" />
        )}
        <span>{value}</span>
      </span>
    </div>
  );
}

import { useAuth } from "../../../../contexts/AuthContext";
import {
  BadgeCheck,
  CalendarDays,
  Clock3,
  Mail,
  ShieldCheck,
  User,
  UserCog,
} from "lucide-react";

export default function Profile() {
  const { user } = useAuth();

  if (!user) return null;

  const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName,)}&background=6366f1&color=fff&size=256`;

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const formatDateTime = (date) =>
    new Date(date).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  return (
    <div className="min-h-screen bg-background-color pt-20 md:pt-8 pb-10">
      <div className="max-w-6xl mx-auto px-5">
        <div className="rounded-3xl overflow-hidden border border-card-border shadow-sm bg-card-background">
          <div className="h-40 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600" />

          <div className="px-8 pb-8 -mt-16">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              <div className="flex items-center gap-5">
                <img
                  src={avatar}
                  alt="Avatar"
                  className="w-32 h-32 rounded-full border-4 border-card-background shadow-xl"
                />

                <div>
                  <h1 className="text-3xl font-bold text-text-primary">
                    {user.fullName}
                  </h1>

                  <p className="text-text-secondary text-lg">
                    @{user.username}
                  </p>

                  <div className="flex flex-wrap gap-3 mt-4">
                    <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-success-bg text-success-text text-sm font-medium">
                      <BadgeCheck size={16} />
                      Verified Email
                    </span>

                    <span
                      className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                        user.isActive
                          ? "bg-button-primary/10 text-button-primary"
                          : "bg-error-bg text-error-text"
                      }`}
                    >
                      <ShieldCheck size={16} />
                      {user.isActive ? "Active User" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>

              {/* <div className="flex gap-3">
                <button className="px-5 py-3 rounded-xl bg-button-primary text-button-primary-text font-medium hover:bg-button-primary-hover transition">
                  Edit Profile
                </button>

                <button className="px-5 py-3 rounded-xl border border-border-primary text-text-primary hover:bg-background-secondary transition">
                  Change Password
                </button>
              </div> */}
            </div>
          </div>
        </div>


        <div className="grid lg:grid-cols-2 gap-6 mt-8">
          <div className="rounded-2xl border border-card-border bg-card-background p-6">
            <h2 className="text-xl font-semibold mb-6">Account Information</h2>

            <div className="space-y-6">
              <InfoRow
                icon={<User size={18} />}
                label="Full Name"
                value={user.fullName}
              />

              <InfoRow
                icon={<UserCog size={18} />}
                label="Username"
                value={user.username}
              />

              <InfoRow
                icon={<Mail size={18} />}
                label="Email"
                value={user.email}
              />

              <InfoRow
                icon={<ShieldCheck size={18} />}
                label="Account Type"
                value={user.type}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-card-border bg-card-background p-6">
            <h2 className="text-xl font-semibold mb-6">Account Activity</h2>

            <div className="space-y-6">
              <InfoRow
                icon={<CalendarDays size={18} />}
                label="Member Since"
                value={formatDate(user.createdAt)}
              />

              <InfoRow
                icon={<Clock3 size={18} />}
                label="Last Login"
                value={formatDateTime(user.lastLogin)}
              />

              <InfoRow
                icon={<Clock3 size={18} />}
                label="Last Updated"
                value={formatDateTime(user.updatedAt)}
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-card-border bg-card-background p-6 mt-6">
          <h2 className="text-xl font-semibold mb-6">Security</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <StatusCard
              title="Email Verification"
              value={user.isEmailVerified ? "Verified" : "Not Verified"}
              success={user.isEmailVerified}
            />

            <StatusCard
              title="Account Status"
              value={user.isActive ? "Active" : "Inactive"}
              success={user.isActive}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex justify-between items-center border-b border-border-secondary pb-4">
      <div className="flex items-center gap-3 text-text-secondary">
        <div className="p-2 rounded-lg bg-button-primary/10 text-button-primary">
          {icon}
        </div>

        <span>{label}</span>
      </div>

      <span className="font-semibold text-text-primary capitalize">
        {value}
      </span>
    </div>
  );
}

function StatusCard({ title, value, success }) {
  return (
    <div
      className={`rounded-xl border p-5 ${
        success
          ? "border-green-500/30 bg-green-500/5"
          : "border-red-500/30 bg-red-500/5"
      }`}
    >
      <p className="text-sm text-text-secondary">{title}</p>

      <p
        className={`mt-2 text-lg font-semibold ${
          success ? "text-green-500" : "text-red-500"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

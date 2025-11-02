import { ArrowRight, CheckCircle, Target } from "lucide-react"

import SessionItemSkeleton from '../skeletons/SessionItemSkeleton.jsx'
import { Activity } from "react"

const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds < 0) seconds = 0;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const SessionItem = ({ session }) => {
  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };
  const isCompleted = ((session.completedSegments || 0) / session.totalSegments) == 1;
  return (
    <div className="flex flex-col p-4 rounded-xl card-hover transition-all bg-background-secondary border border-border-secondary hover:border-blue-400"
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
          style={{
            backgroundColor: isCompleted
              ? "var(--color-button-success)"
              : "var(--color-button-primary)",
          }}
        >
          <div
            style={{
              color: isCompleted
                ? "var(--color-button-success)"
                : "var(--color-button-primary)",
            }}
          >
            {isCompleted ? <CheckCircle size={20} className="text-text-primary" /> : <Target size={20} className="text-text-primary"/>}
          </div>
        </div>
        <span className="text-xs px-2 py-1 rounded-full font-semibold bg-card-background text-text-muted">
          {formatDate(session.createdAt)}
        </span>
      </div>
      <p
        className="font-semibold text-sm mb-2 line-clamp-2 text-text-primary"
        title={session.title}
      >
        {session.title}
      </p>
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-muted">
          {formatTime(session.actualFocusDuration || 0)}
        </span>
      </div>
    </div>
  );
};

const RecentSessions = ({ recentSessions = [], navigate }) => {
    return (
        <div className="rounded-2xl p-6 shadow-lg card-hover bg-card-background border border-card-border hover:border-blue-400">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Activity size={22} className="text-button-primary" />
                <h3 className="text-xl font-bold text-text-primary">
                  Recent Sessions
                </h3>
              </div>
              <button
                onClick={() => navigate("/sessions")}
                className="text-sm flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all hover:scale-105 text-button-primary bg-background-secondary"
              >
                View All <ArrowRight size={14} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 hover:border-blue-400">
              {!recentSessions ? (
                <>
                  <SessionItemSkeleton />
                  <SessionItemSkeleton />
                  <SessionItemSkeleton />
                </>
              ) : recentSessions.length > 0 ? (
                recentSessions
                  .slice(0, 6)
                  .map((session) => (
                    <SessionItem key={session.id} session={session} />
                  ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <Target size={48} className="mx-auto mb-3 text-text-muted" />
                  <p className="text-sm text-text-secondary">
                    You have no recent sessions. Start your first session!
                  </p>
                </div>
              )}
            </div>
          </div>
    )
}

export default RecentSessions;
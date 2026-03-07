import { ArrowRight, CheckCircle, Target, Activity } from "lucide-react";
import SessionItemSkeleton from '../skeletons/SessionItemSkeleton.jsx';

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

  const isCompleted = ((session.completedSegments || 0) / session.totalSegments) === 1;

  return (
    <div className="group flex flex-col p-4 rounded-xl transition-all duration-300 bg-background-secondary/50 border border-border-secondary hover:bg-background-secondary hover:border-button-primary hover:shadow-md cursor-pointer">
      {/* Tighter margin bottom (mb-3 instead of mb-4) */}
      <div className="flex items-start justify-between mb-3">
        {/* Smaller icon container (w-10 h-10 instead of w-12 h-12) */}
        <div
          className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center shadow-sm"
          style={{
            backgroundColor: isCompleted
              ? "var(--color-button-success)"
              : "var(--color-button-primary)",
          }}
        >
          {isCompleted ? (
            <CheckCircle size={20} className="text-white" />
          ) : (
            <Target size={20} className="text-white" />
          )}
        </div>
        
        {/* Slightly smaller text and padding for the date badge */}
        <span className="text-[11px] px-2 py-1 rounded font-medium bg-card-background border border-border-secondary text-text-muted group-hover:border-border-primary transition-colors">
          {formatDate(session.createdAt)}
        </span>
      </div>

      <div>
        <p
          className="font-semibold text-sm mb-1 line-clamp-1 text-text-primary group-hover:text-button-primary transition-colors"
          title={session.title}
        >
          {session.title || "Untitled Session"}
        </p>
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-secondary font-medium">
            {formatTime(session.actualFocusDuration || 0)}
          </span>
        </div>
      </div>
    </div>
  );
};

const RecentSessions = ({ recentSessions = [], navigate }) => {
  return (
    <div className="rounded-2xl p-5 shadow-sm bg-card-background border border-card-border transition-all">
      
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Activity size={20} className="text-button-primary" />
          <h3 className="text-lg font-bold text-text-primary">
            Recent Sessions
          </h3>
        </div>
        <button
          onClick={() => navigate("/sessions")}
          className="text-xs flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors hover:bg-button-primary/10 text-button-primary font-medium"
        >
          View All <ArrowRight size={14} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
        {!recentSessions ? (
          <>
            <SessionItemSkeleton />
            <SessionItemSkeleton />
            <SessionItemSkeleton />
          </>
        ) : recentSessions.length > 0 ? (
          recentSessions
            .slice(0, 12)
            .map((session) => (
              <SessionItem key={session.id} session={session} />
            ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-8 rounded-xl bg-background-secondary/30 border border-dashed border-border-secondary">
            <Target size={32} className="mb-2 text-text-muted/50" />
            <p className="text-sm font-medium text-text-secondary">
              No recent sessions yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentSessions;
import StreakRing from "./StreakRing";
import TodayStatusBadge from "./TodayStatusBadge";

export default function StreakCard({
  dailyStreak,
  dailyTargetMinutes,
  todayFocusMinutes,
  streakRate,
  state,
  freezeCredits,
}) {
  const hasStreak = dailyStreak > 0;
  const roundedToday = Math.round(todayFocusMinutes);
  const timeLeft = Math.max(dailyTargetMinutes - roundedToday, 0);
  const extraMinutes = Math.max(roundedToday - dailyTargetMinutes, 0);

  function formatMinutes(minutes) {
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  }

  const statusConfig = {
    green: {
      color: "text-text-primary",
      subtitle: "Momentum secured",
      icon: "🎯",
      action: "Build deeper focus or recharge",
      label: "Target Completed",
    },
    yellow: {
      color: "text-text-accent",
      subtitle: "Almost there — stay focused",
      icon: "⚡",
      action: `Focus ${timeLeft} more min`,
      label: "Secure your streak",
    },
    red: {
      color: "text-button-danger",
      subtitle: hasStreak
        ? "Stay consistent today"
        : "Complete your first focus session",
      icon: "⏳",
      action: `Start a ${dailyTargetMinutes}-min focus`,
      label: "Action required",
    },
  };

  const currentStatus = statusConfig[state] || statusConfig.red;

  return (
    <div className="rounded-2xl p-6 bg-card-background border border-card-border hover:border-border-primary/50 shadow-sm transition-all duration-300">
      <div className="grid gap-6 h-full items-center grid-cols-1 lg:grid-cols-[1.4fr_1fr_1fr]">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <h2 className="text-3xl font-black text-text-primary flex items-center gap-2 tracking-tight">
              🔥 {hasStreak ? `${dailyStreak}-Day Streak` : "Start your streak"}
            </h2>
            <p className="text-sm font-medium text-text-secondary/80">
              {currentStatus.subtitle}
            </p>
          </div>

          <div className="h-px w-full bg-border-secondary/40 my-3" />

          <div className={`flex flex-col gap-2`}>
            <p
              className={`text-sm font-bold flex items-center gap-2 ${currentStatus.color}`}
            >
              {currentStatus.icon}
              <span>
                {state === "green" ? (
                  <>
                    {currentStatus.label}: {formatMinutes(roundedToday)}
                    {extraMinutes > 0 && (
                      <span className="ml-1.5 text-text-athena text-xs bg-text-athena/10 px-2 py-0.5 rounded-full">
                        +{formatMinutes(extraMinutes)} extra
                      </span>
                    )}
                  </>
                ) : (
                  `${roundedToday} / ${dailyTargetMinutes} min — ${currentStatus.label}`
                )}
              </span>
            </p>
            <TodayStatusBadge state={state} timeLeft={timeLeft} />
          </div>

          <div className="flex items-center gap-2 mt-2 px-3 py-1.5 bg-background-secondary/50 rounded-lg w-fit border border-border-secondary/30">
            <span className="text-text-accent text-xs">🧊</span>
            <span className="text-[11px] uppercase font-bold text-text-muted tracking-wider">
              Freeze Credits
            </span>
            <span className="text-sm text-text-primary font-black ml-1">
              {freezeCredits}
            </span>
          </div>
        </div>

        <div className="hidden lg:flex flex-col justify-center gap-4 px-8 border-l border-border-secondary/30 h-3/4">
          <p className="text-[10px] uppercase font-black tracking-widest text-text-muted opacity-60">
            Path Forward
          </p>

          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-md bg-background-secondary flex items-center justify-center text-xs shrink-0">
                ⏱
              </div>
              <p className="text-sm text-text-secondary font-medium leading-tight">
                {currentStatus.action}
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-md bg-background-secondary flex items-center justify-center text-xs shrink-0">
                🛡
              </div>
              <p className="text-sm text-text-secondary font-medium leading-tight">
                {state === "green"
                  ? "Momentum is on your side"
                  : "Protect your daily progress"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center lg:pl-6 lg:border-l lg:border-border-secondary/30">
          <div className="relative group cursor-help">
            <StreakRing
              streakRate={hasStreak ? streakRate : 0}
              state={hasStreak ? state : "neutral"}
            />

            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-text-primary text-background-color text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-bold">
              {hasStreak
                ? "Percentage of targets met over the last 7 days"
                : "Complete today to start your consistency score"}
            </div>

            {state === "red" && (
              <div className="absolute inset-0 rounded-full bg-button-danger/5 animate-ping -z-10" />
            )}
          </div>

          <p className="mt-3 text-[10px] uppercase font-black tracking-widest text-text-muted">
            {hasStreak ? "Consistency Score" : "Ready to Start"}
          </p>
        </div>
      </div>
    </div>
  );
}

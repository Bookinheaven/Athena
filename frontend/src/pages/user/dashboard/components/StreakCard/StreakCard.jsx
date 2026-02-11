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

  const timeLeft = Math.max(dailyTargetMinutes - todayFocusMinutes, 0);
  const extraMinutes = Math.max(todayFocusMinutes - dailyTargetMinutes, 0);

  const stateColor =
    state === "green"
      ? "text-text-primary"
      : state === "yellow"
        ? "text-text-accent"
        : state === "red"
          ? "text-button-danger"
          : "text-text-primary";

  const subtitleText =
    state === "green"
      ? "Momentum secured"
      : state === "yellow"
        ? "Almost there — stay focused"
        : hasStreak
          ? "Stay consistent today"
          : "Complete your first focus session";

  const progressText =
    state === "green" ? (
      <>
        🎯 Target Completed: {todayFocusMinutes} min
        {extraMinutes > 0 && (
          <span className="ml-1 text-text-athena">(+{extraMinutes} extra)</span>
        )}
      </>
    ) : state === "yellow" ? (
      <>
        ⚡ {todayFocusMinutes} / {dailyTargetMinutes} min - secure your streak
      </>
    ) : (
      <>
        ⏳ {todayFocusMinutes} / {dailyTargetMinutes} min
      </>
    );

  const nextAction =
    state === "green"
      ? "Build deeper focus or recharge"
      : state === "yellow"
        ? `Focus ${timeLeft} more min`
        : `Start a ${dailyTargetMinutes}-min focus`;

  const nextSupport =
    state === "green"
      ? "Momentum is on your side"
      : hasStreak
        ? "Protect your streak"
        : "Build your first streak";

  return (
    <div
      className="
        rounded-xl p-6
        bg-card-background
        border border-card-border
        hover:border-border-primary
        shadow-sm
        transition-colors
      "
    >
      <div
        className="
          grid gap-6 h-full items-center
          grid-cols-1
          lg:grid-cols-[1.4fr_1fr_1fr]
        "
      >
        <div className="flex flex-col gap-3">
          <h2 className="text-3xl font-bold text-text-primary flex items-center gap-2">
            🔥 {hasStreak ? `${dailyStreak}-Day Streak` : "Start your streak"}
          </h2>

          <p className="text-sm text-text-secondary">{subtitleText}</p>

          <div className="h-px w-full bg-border-secondary/60 my-2" />

          <p className={`text-sm font-medium ${stateColor}`}>{progressText}</p>

          <TodayStatusBadge state={state} timeLeft={timeLeft} />

          {/* Freeze */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-text-accent">🧊</span>
            <span className="text-text-muted">Freeze</span>
            <span className="text-text-primary font-semibold">
              {freezeCredits}
            </span>
          </div>
        </div>

        {/* MIDDLE */}
        <div
          className="
            hidden lg:flex flex-col justify-center gap-3
            px-6 border-l border-border-secondary/50
          "
        >
          <p className="text-xs uppercase tracking-wide text-text-muted">
            Next Step
          </p>

          <div className="flex flex-col gap-2 text-sm text-text-secondary">
            <div className="flex items-center gap-2">
              ⏱ <span>{nextAction}</span>
            </div>
            <div className="flex items-center gap-2">
              🔥 <span>{nextSupport}</span>
            </div>
          </div>
        </div>

        <div
          className="
            flex flex-col items-center justify-center
            lg:pl-6 lg:border-l lg:border-border-secondary/50
          "
        >
          <StreakRing
            streakRate={hasStreak ? streakRate : 0}
            state={hasStreak ? state : "neutral"}
          />
          <p className="mt-2 text-xs text-text-muted">Daily progress</p>
        </div>
      </div>
    </div>
  );
}

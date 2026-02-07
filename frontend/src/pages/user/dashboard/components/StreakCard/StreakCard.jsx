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

  const titleText = hasStreak
    ? `${dailyStreak}-Day Streak`
    : "Start your streak today";

  const subtitleText = hasStreak
    ? "Keep the chain alive"
    : "Complete your first focus session";

  const timeLeft = Math.max(dailyTargetMinutes - todayFocusMinutes, 0);

  return (
    <div
      className="
        rounded-xl p-6
        bg-card-background
        border border-card-border
        hover:border-orange-400/60
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
        <div className="h-full flex flex-col gap-3 justify-start">
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            🔥 <span>{titleText}</span>
          </h2>

          <p className="text-sm text-text-secondary">{subtitleText}</p>

          <div className="h-px w-full bg-border-secondary/60 my-2" />

          <p className="text-sm font-semibold text-text-primary">
            Today: {todayFocusMinutes} / {dailyTargetMinutes} min
          </p>

          <TodayStatusBadge state={state} timeLeft={timeLeft} />

          <div className="text-sm text-neutral-400 flex items-center gap-1">
            🥶 Freeze credits:
            <span className="text-white font-medium">
              {freezeCredits}
            </span>
          </div>
        </div>

        <div
          className="
            h-full hidden lg:flex flex-col justify-center gap-3
            px-6 border-l border-white/5
          "
        >
          <p className="text-xs uppercase tracking-wide text-text-secondary">
            Next step
          </p>

          <div className="flex flex-col gap-2 text-sm text-neutral-300">
            <div className="flex items-center gap-2">
              ⏱ <span>Start a {dailyTargetMinutes}-min focus</span>
            </div>
            <div className="flex items-center gap-2">
              🔥 <span>
                {hasStreak ? "Protect your streak" : "Build your first streak"}
              </span>
            </div>
          </div>
        </div>

        <div
          className="
            h-full flex flex-col items-center justify-center
            lg:pl-6 lg:border-l lg:border-white/5
          "
        >
          <StreakRing
            streakRate={hasStreak ? streakRate : 0}
            state={hasStreak ? state : "neutral"}
          />
          <p className="mt-2 text-xs text-text-secondary">
            Daily progress
          </p>
        </div>
      </div>
    </div>
  );
}

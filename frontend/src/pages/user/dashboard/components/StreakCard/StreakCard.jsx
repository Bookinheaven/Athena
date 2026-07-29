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
        <div className="rounded-2xl p-6 bg-card-background border border-card-border hover:border-button-primary/50 shadow-sm transition-colors">
            <div className="grid gap-6 h-full items-center grid-cols-1 lg:grid-cols-[1.4fr_1fr_1fr]">
                <div className="flex flex-col justify-between gap-4 h-full">
                    <div>
                        <h2 className="text-3xl font-extrabold text-text-primary flex items-center gap-2.5 tracking-tight">
                            <span>🔥</span> {hasStreak ? `${dailyStreak}-Day Streak` : "Start your streak"}
                        </h2>
                        <p className="text-sm font-medium text-text-secondary mt-1">
                            {currentStatus.subtitle}
                        </p>
                    </div>

                    <div className="h-px w-full bg-border-primary my-1" />

                    <div className="flex flex-col gap-2.5">
                        <p className={`text-sm font-bold flex items-center gap-2 ${currentStatus.color}`}>
                            <span>{currentStatus.icon}</span>
                            <span className="font-mono text-xs sm:text-sm">
                                {state === "green" ? (
                                    <>
                                        {currentStatus.label}: {formatMinutes(roundedToday)}
                                        {extraMinutes > 0 && (
                                            <span className="ml-2 text-emerald-500 text-xs font-mono bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
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

                    <div className="flex items-center gap-2 mt-2 px-3 py-1.5 bg-background-secondary rounded-xl w-fit border border-border-primary shadow-xs">
                        <span className="text-button-primary text-xs">🧊</span>
                        <span className="text-[10px] font-mono uppercase font-bold text-text-secondary tracking-wider">
                            Freeze Credits
                        </span>
                        <span className="text-sm font-mono font-black text-text-primary ml-1">
                            {freezeCredits}
                        </span>
                    </div>
                </div>

                <div className="hidden lg:flex flex-col justify-center gap-5 px-8 border-l border-border-primary h-full">
                    <p className="text-[10px] font-mono uppercase font-bold tracking-widest text-text-muted">
                        Path Forward
                    </p>

                    <div className="flex flex-col gap-4">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-xl bg-button-primary/10 border border-button-primary/20 text-button-primary flex items-center justify-center text-sm shrink-0 shadow-xs">
                                ⏱
                            </div>
                            <div>
                                <p className="text-xs font-mono font-bold uppercase tracking-wider text-text-muted">Next Action</p>
                                <p className="text-sm text-text-primary font-medium leading-tight mt-0.5">
                                    {currentStatus.action}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-xl bg-button-primary/10 border border-button-primary/20 text-button-primary flex items-center justify-center text-sm shrink-0 shadow-xs">
                                🛡
                            </div>
                            <div>
                                <p className="text-xs font-mono font-bold uppercase tracking-wider text-text-muted">Streak Guard</p>
                                <p className="text-sm text-text-primary font-medium leading-tight mt-0.5">
                                    {state === "green"
                                        ? "Momentum is on your side"
                                        : "Protect your daily progress"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center lg:pl-6 lg:border-l lg:border-border-primary">
                    <div className="relative group cursor-help">
                        <StreakRing
                            streakRate={hasStreak ? streakRate : 0}
                            state={hasStreak ? state : "neutral"}
                        />

                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-background-primary text-text-primary border border-border-primary text-[10px] font-mono font-bold px-2.5 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-md">
                            {hasStreak
                                ? "Percentage of targets met over the last 7 days"
                                : "Complete today to start your consistency score"}
                        </div>

                        {state === "red" && (
                            <div className="absolute inset-0 rounded-full bg-rose-500/10 animate-ping -z-10" />
                        )}
                    </div>

                    <p className="mt-4 text-[10px] font-mono uppercase font-bold tracking-widest text-text-muted">
                        {hasStreak ? "Consistency Score" : "Ready to Start"}
                    </p>
                </div>
            </div>
        </div>
    );
}

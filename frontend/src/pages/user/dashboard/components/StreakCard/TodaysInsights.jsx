import {
    Timer,
    Layers,
    Zap,
    AlertTriangle,
} from "lucide-react";

export default function TodaysInsights({
    sessions = 0,
    focusBlocks = 0,
    longestFocus = "—",
    distractions = "—",
}) {
    return (
        <div className="rounded-2xl p-6 bg-card-background border border-card-border hover:border-button-primary/50 shadow-sm transition-colors flex flex-col justify-between">
            <div className="mb-6 border-b border-border-primary pb-4">
                <p className="text-xs font-mono uppercase tracking-wider text-text-muted font-bold">
                    Today's Insights
                </p>
                <p className="text-sm text-text-secondary mt-1">
                    Your real-time focus activity metrics
                </p>
            </div>

            <div className="flex flex-col gap-4">
                <InsightRow
                    icon={Timer}
                    label="Completed Sessions"
                    value={sessions}
                />

                <InsightRow
                    icon={Layers}
                    label="Focus Blocks"
                    value={focusBlocks}
                />

                <InsightRow
                    icon={Zap}
                    label="Longest Focus"
                    value={longestFocus}
                />

                <InsightRow
                    icon={AlertTriangle}
                    label="Distractions"
                    value={distractions != null ? distractions : "-"}
                    valueClass={
                        distractions === "Low"
                            ? "text-emerald-500 font-bold"
                            : distractions === "Medium"
                                ? "text-amber-500 font-bold"
                                : "text-rose-500 font-bold"
                    }
                />
            </div>
        </div>
    );
}

function InsightRow({
    icon: Icon,
    label,
    value,
    valueClass = "text-text-primary",
}) {
    return (
        <div className="flex items-center justify-between p-2 rounded-xl hover:bg-background-secondary transition-colors">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-button-primary/10 text-button-primary border border-button-primary/20 shadow-xs">
                    <Icon size={16} />
                </div>
                <span className="text-text-secondary text-sm font-medium font-sans">
                    {label}
                </span>
            </div>

            <span className={`font-mono font-bold text-base ${valueClass}`}>
                {value}
            </span>
        </div>
    );
}

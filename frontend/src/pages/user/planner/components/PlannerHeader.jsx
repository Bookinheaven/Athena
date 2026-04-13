import { TrendingUp } from "lucide-react";

export default function PlannerHeader() {
    return (
        <header className="mb-4 shrink-0">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-button-primary/10 rounded-xl">
                    <TrendingUp className="text-button-primary w-6 h-6" />
                </div>
                <span className="text-sm font-black uppercase tracking-widest text-button-primary/80">
                    Mission Control
                </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">
                Daily Planner
            </h1>
            <p className="text-text-muted font-medium mt-2 text-lg">
                Organize your tasks, goals, and notes.
            </p>
        </header>
    );
}
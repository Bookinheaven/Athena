import { Play, Minus } from "lucide-react";

export default function SelectedTasksBar({
    selectedTasks,
    setSelectedTasks,
    tasks,
    handleStartFocusButton
}) {
    if (selectedTasks.length === 0) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-card-background/90 backdrop-blur-xl border border-card-border p-3 rounded-2xl shadow-2xl flex items-center gap-4 animate-fade-in shadow-[0_10px_40px_rgba(124,58,237,0.2)]">

            <span className="text-sm font-black text-text-primary px-2">
                {selectedTasks.length} Task{selectedTasks.length > 1 && 's'} Selected
            </span>

            <button
                onClick={() =>
                    handleStartFocusButton(
                        tasks.filter(t => selectedTasks.includes(t._id))
                    )
                }
                className="bg-button-primary text-white text-sm font-black px-6 py-2.5 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center gap-2"
            >
                <Play size={16} fill="currentColor" />
                Focus on Selected
            </button>

            <button
                onClick={() => setSelectedTasks([])}
                className="p-2 text-text-muted hover:text-red-500 transition-colors rounded-xl hover:bg-red-500/10"
            >
                <Minus size={18} />
            </button>

        </div>
    );
}
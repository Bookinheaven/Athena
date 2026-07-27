export default function Timeline({ tasks, handleDropTaskToTime }) {
    return (
        <div className="bg-card-background border border-card-border p-5 rounded-3xl shadow-xl lg:flex-[1.5] flex flex-col min-h-0 overflow-hidden">
            <h2 className="text-lg font-black shrink-0 mb-4">Daily Timeline</h2>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                {Array.from({ length: 13 }, (_, i) => i + 8).map((hour) => {
                    const hourLabel =
                        hour > 12
                            ? `${hour - 12} PM`
                            : hour === 12
                                ? "12 PM"
                                : `${hour} AM`;

                    const plannedTasksHere = tasks.filter((t) => {
                        if (!t.plannedDate) return false;

                        const d = new Date(t.plannedDate);

                        return (
                            new Date().toDateString() === d.toDateString() &&
                            d.getHours() === hour
                        );
                    });

                    return (
                        <div
                            key={hour}
                            onDragOver={(e) => {
                                e.preventDefault();
                                e.currentTarget.classList.add("bg-button-primary/5");
                            }}
                            onDragLeave={(e) => {
                                e.currentTarget.classList.remove("bg-button-primary/5");
                            }}
                            onDrop={(e) => {
                                e.preventDefault();
                                e.currentTarget.classList.remove("bg-button-primary/5");

                                const taskId = e.dataTransfer.getData("taskId");
                                if (!taskId) return;

                                handleDropTaskToTime(taskId, hour);
                            }}
                            className="flex gap-4 border-t border-border-secondary/30 min-h-[60px] py-2 transition-colors"
                        >
                            <span className="w-12 text-[10px] font-bold text-text-muted text-right">
                                {hourLabel}
                            </span>

                            <div className="flex-1 border-l border-border-secondary/30 pl-3 flex flex-col gap-1">
                                {plannedTasksHere.map((t) => (
                                    <div
                                        key={t._id}
                                        className="text-xs font-bold bg-button-primary text-white px-2 py-1 rounded-lg truncate"
                                    >
                                        {t.title}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

import { Plus, Edit2, Trash2, CalendarDays, Check, X } from "lucide-react";

export default function GoalList({
    goals,
    newGoal,
    setNewGoal,
    handleAddGoal,

    editingGoal,
    setEditingGoal,
    editingGoalTitle,
    setEditingGoalTitle,
    handleEditGoalSave,

    dateEditingGoal,
    setDateEditingGoal,
    goalStartDate,
    setGoalStartDate,
    goalEndDate,
    setGoalEndDate,
    handleEditGoalDates,

    handleDeleteGoal,
}) {
    const getGoalTimeProgress = (goal) => {
        if (!goal.startDate || !goal.dueDate) return 0;
        const start = new Date(goal.startDate).getTime();
        const end = new Date(goal.dueDate).getTime();
        const now = Date.now();
        if (now <= start) return 0;
        if (now >= end) return 100;
        const total = end - start;
        const elapsed = now - start;
        return Math.round((elapsed / total) * 100);
    };

    return (
        <div className="bg-card-background border border-card-border p-5 rounded-3xl shadow-xl flex-1 flex flex-col min-h-0 overflow-hidden h-full">
            <div className="shrink-0 mb-4">
                <h2 className="text-lg font-black text-text-primary">Long-term Goals</h2>

                <div className="flex gap-2 mt-3">
                    <input
                        type="text"
                        value={newGoal}
                        onChange={(e) => setNewGoal(e.target.value)}
                        placeholder="Define a new objective..."
                        onKeyDown={(e) => e.key === "Enter" && handleAddGoal()}
                        className="flex-1 bg-background-secondary border border-border-secondary px-4 py-2 text-sm rounded-xl outline-none focus:border-button-primary transition-all text-text-primary placeholder:text-text-muted"
                    />

                    <button
                        onClick={handleAddGoal}
                        className="bg-button-primary p-2.5 rounded-xl text-white hover:scale-105 active:scale-95 transition-all shadow-lg shadow-button-primary/20"
                    >
                        <Plus size={18} strokeWidth={3} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2 min-h-0">
                {goals.map((goal) => (
                    <div key={goal._id} className="p-4 rounded-2xl bg-background-secondary/40 border border-border-secondary group relative transition-all hover:border-button-primary/30">

                        <div className="flex justify-between items-start mb-3 gap-2">
                            <div className="flex-1 min-w-0">
                                {editingGoal === goal._id ? (
                                    <input
                                        autoFocus
                                        value={editingGoalTitle}
                                        onChange={(e) => setEditingGoalTitle(e.target.value)}
                                        // FIXED: Save and exit on blur
                                        onBlur={() => handleEditGoalSave(goal._id)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") handleEditGoalSave(goal._id);
                                            if (e.key === "Escape") setEditingGoal(null);
                                        }}
                                        className="font-bold text-sm bg-transparent border-b-2 border-button-primary outline-none text-text-primary w-full"
                                    />
                                ) : (
                                    <p
                                        onDoubleClick={() => {
                                            setEditingGoal(goal._id);
                                            setEditingGoalTitle(goal.title);
                                        }}
                                        className="font-bold text-sm cursor-pointer hover:text-button-primary truncate text-text-primary"
                                    >
                                        {goal.title}
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                <button
                                    onClick={() => {
                                        setEditingGoal(goal._id);
                                        setEditingGoalTitle(goal.title);
                                    }}
                                    className="p-1.5 hover:bg-background-secondary rounded-lg text-text-muted hover:text-button-primary"
                                >
                                    <Edit2 size={14} />
                                </button>
                                <button
                                    onClick={() => {
                                        setDateEditingGoal(goal._id);
                                        setGoalStartDate(goal.startDate ? new Date(goal.startDate).toISOString().split("T")[0] : "");
                                        setGoalEndDate(goal.dueDate ? new Date(goal.dueDate).toISOString().split("T")[0] : "");
                                    }}
                                    className="p-1.5 hover:bg-background-secondary rounded-lg text-text-muted hover:text-button-primary"
                                >
                                    <CalendarDays size={14} />
                                </button>
                                <button
                                    onClick={() => handleDeleteGoal(goal._id)}
                                    className="p-1.5 hover:bg-background-secondary rounded-lg text-text-muted hover:text-button-danger"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>

                        {dateEditingGoal === goal._id && (
                            <div className="mb-4 p-3 bg-background-color rounded-2xl border border-button-primary/30 space-y-3 relative shadow-inner animate-in fade-in slide-in-from-top-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-button-primary">Set Duration</span>
                                    <button onClick={() => setDateEditingGoal(null)} className="text-text-muted hover:text-text-primary">
                                        <X size={14} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 gap-2">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[9px] font-bold text-text-muted ml-1 uppercase">Start Date</label>
                                        <input
                                            type="date"
                                            value={goalStartDate}
                                            onChange={(e) => setGoalStartDate(e.target.value)}
                                            className="bg-background-secondary border border-border-secondary rounded-lg px-2 py-1.5 text-xs text-text-primary outline-none focus:border-button-primary"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[9px] font-bold text-text-muted ml-1 uppercase">Target Date</label>
                                        <input
                                            type="date"
                                            value={goalEndDate}
                                            onChange={(e) => setGoalEndDate(e.target.value)}
                                            className="bg-background-secondary border border-border-secondary rounded-lg px-2 py-1.5 text-xs text-text-primary outline-none focus:border-button-primary"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleEditGoalDates(goal._id)}
                                    className="w-full py-2 bg-button-primary text-white rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-110"
                                >
                                    <Check size={12} /> Update Schedule
                                </button>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <div className="h-1.5 w-full bg-border-secondary rounded-full overflow-hidden relative">
                                <div
                                    className="absolute top-0 left-0 h-full bg-text-muted/20"
                                    style={{ width: `${getGoalTimeProgress(goal)}%`, zIndex: 0 }}
                                />
                                <div
                                    className="absolute top-0 left-0 h-full bg-button-primary shadow-[0_0_8px_rgba(124,58,237,0.4)]"
                                    style={{ width: `${goal.progress || 0}%`, zIndex: 1 }}
                                />
                            </div>

                            <div className="flex justify-between items-end">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-text-primary uppercase tracking-tight">
                                        {goal.progress || 0}% Complete
                                    </span>
                                    {goal.startDate && goal.dueDate && (
                                        <span className="text-[9px] font-bold text-text-muted">
                                            {new Date(goal.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} — {new Date(goal.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })}
                                        </span>
                                    )}
                                </div>

                                {goal.startDate && goal.dueDate && (
                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${getGoalTimeProgress(goal) > (goal.progress || 0) ? 'text-amber-500 bg-amber-500/10' : 'text-emerald-500 bg-emerald-500/10'}`}>
                                        {getGoalTimeProgress(goal)}% Time Used
                                    </span>
                                )}
                            </div>
                        </div>

                    </div>
                ))}
            </div>
        </div>
    );
}
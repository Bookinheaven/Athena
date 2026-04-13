import { Plus, Loader2, Flag, Target } from "lucide-react";
import { useState } from "react";
import CustomSelect from "../../../../components/customs/CustomSelect";

export default function TaskInput({ goals, handleAddTask }) {
  const [title, setTitle] = useState("");
  const [selectedGoal, setSelectedGoal] = useState("");
  const [priority, setPriority] = useState("medium");
  const [loading, setLoading] = useState(false);

  const priorityOptions = [
    { value: "low", label: "Low", color: "bg-emerald-500" },
    { value: "medium", label: "Medium", color: "bg-amber-500" },
    { value: "high", label: "High", color: "bg-red-500" },
  ];

  const onAdd = async () => {
    if (!title.trim() || loading) return;

    try {
      setLoading(true);
      await handleAddTask(title, selectedGoal || null, priority);
      setTitle("");
      setSelectedGoal("");
      setPriority("medium");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card-background border border-card-border p-2 rounded-[1.5rem] shadow-2xl shadow-black/20 shrink-0 flex flex-col lg:flex-row gap-2 transition-all">
      <div className="flex-1 relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/50 group-focus-within:text-button-primary transition-colors">
          <Plus size={18} strokeWidth={2.5} />
        </div>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a task to Athena..."
          onKeyDown={(e) => e.key === "Enter" && onAdd()}
          className="w-full bg-background-secondary/30 rounded-2xl pl-12 pr-4 py-3.5 outline-none font-bold text-sm text-text-primary placeholder:text-text-muted/40 focus:bg-background-secondary/60 transition-all border border-transparent focus:border-button-primary/20"
        />
      </div>

      <div className="flex items-center gap-2">
        <CustomSelect
          value={priority}
          onChange={setPriority}
          options={priorityOptions}
          className="sm:min-w-[110px] bg-background-secondary/50 border-transparent"
          icon={Flag}
          renderOption={(opt) => (
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${opt.color}`} />
              <span>{opt.label}</span>
            </div>
          )}
        />

        <CustomSelect
          value={selectedGoal}
          onChange={setSelectedGoal}
          placeholder="Set Goal"
          align="right"
          className="sm:min-w-[140px] bg-background-secondary/50 border-transparent"
          icon={Target}
          options={[
            { value: "no_goals", label: "No Goal" },
            ...goals.map((g) => ({ value: g._id, label: g.title })),
          ]}
        />

        <button
          onClick={onAdd}
          disabled={loading || !title.trim()}
          className="bg-button-primary text-white h-[46px] w-[46px] flex items-center justify-center rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-button-primary/25 disabled:opacity-30 disabled:scale-100 disabled:shadow-none shrink-0"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Plus size={22} strokeWidth={3} />
          )}
        </button>
      </div>
    </div>
  );
}

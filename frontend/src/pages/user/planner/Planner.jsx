import { useAuth } from "../../../../contexts/AuthContext.jsx";
import { Plus, ListTodo, CalendarDays, StickyNote } from "lucide-react";

export default function Planner() {
<<<<<<< Updated upstream
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background-color text-text-primary pt-20 md:pt-10 pb-12 lg:pt-5">
      <div className="px-4 sm:px-6 lg:px-9 w-full">

        {/* TOP ACTION BAR */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-button-primary text-button-primary-text">
            <Plus size={16} /> Add Task
          </button>

          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-button-secondary text-button-secondary-text">
            <StickyNote size={16} /> Add Note
          </button>

          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-button-secondary text-button-secondary-text">
            <CalendarDays size={16} /> Schedule
          </button>
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT: TASKS + SCHEDULE */}
          <div className="lg:col-span-2 space-y-6">

            {/* TASKS CARD */}
            <div className="rounded-2xl p-5 bg-card-background border border-card-border shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <ListTodo size={18} className="text-button-primary" />
                <h2 className="text-lg font-bold">Tasks</h2>
              </div>

              <div className="text-text-secondary text-sm">
                No tasks yet. Start by adding one.
              </div>
            </div>

            {/* SCHEDULE CARD */}
            <div className="rounded-2xl p-5 bg-card-background border border-card-border shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <CalendarDays size={18} className="text-button-primary" />
                <h2 className="text-lg font-bold">Schedule</h2>
              </div>

              <div className="text-text-secondary text-sm">
                No schedule planned.
              </div>
            </div>

          </div>

          {/* RIGHT: NOTES */}
          <div className="space-y-6">

            <div className="rounded-2xl p-5 bg-card-background border border-card-border shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <StickyNote size={18} className="text-button-primary" />
                <h2 className="text-lg font-bold">Notes</h2>
              </div>

              <div className="text-text-secondary text-sm">
                Capture ideas, thoughts, or plans.
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
=======
    const navigate = useNavigate();

    const [tasks, setTasks] = useState([]);
    const [goals, setGoals] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("order");
    const [filterByStatus, setFilterByStatus] = useState("all");
    const [filterByGoal, setFilterByGoal] = useState("all");
    const [newGoal, setNewGoal] = useState("");

    const [editingGoal, setEditingGoal] = useState(null);
    const [editingGoalTitle, setEditingGoalTitle] = useState("");

    const [editingTask, setEditingTask] = useState(null);
    const [editingTaskTitle, setEditingTaskTitle] = useState("");

    const [activeSession, setActiveSession] = useState(null);

    const [selectedTasks, setSelectedTasks] = useState([]);
    const [showDurationModal, setShowDurationModal] = useState(false);
    const [durationToStart, setDurationToStart] = useState("");
    const [tasksToStart, setTasksToStart] = useState([]);

    const [dateEditingGoal, setDateEditingGoal] = useState(null);
    const [goalStartDate, setGoalStartDate] = useState("");
    const [goalEndDate, setGoalEndDate] = useState("");

    const [editingTaskDate, setEditingTaskDate] = useState(null);
    const [taskPlannedDate, setTaskPlannedDate] = useState("");
    const { notes, createNote, updateNote, deleteNote } = useNotes();

    useEffect(() => {
        const loadPlanner = async () => {
            try {
                const [fetchedTasks, fetchedGoals] = await Promise.all([
                    taskService.getTasks(),
                    goalService.getGoals(),
                ]);
                setTasks(fetchedTasks || []);
                setGoals(fetchedGoals || []);
            } catch (err) {
                console.error("Failed to load planner:", err);
            }
        };
        loadPlanner();
    }, []);

    useEffect(() => {
        const checkActive = async () => {
            try {
                const session = await sessionService.getActiveSession();
                if (session?.status === "active") {
                    setActiveSession(session);
                }
            } catch (err) {
                console.error("Failed to check active session:", err);
            }
        };
        checkActive();
    }, []);

    const confirmStartFocus = async () => {
        try {
            const durationSeconds = durationToStart * 60;
            if (!durationToStart || durationToStart <= 0) return;
            const title =
                tasksToStart.length > 1
                    ? `Batch Focus (${tasksToStart.length} tasks)`
                    : tasksToStart[0]?.title;
            const taskIds = tasksToStart.map((t) => t._id);
            const payload = {
                sessionId: Date.now().toString(),
                title,
                taskIds,
                sessionSegments: [
                    { type: "focus", duration: 0, totalDuration: durationSeconds },
                ],
                plannedDuration: durationSeconds,
                totalBreakMinutes: 0,
                totalFocusMinutes: 0,
            };
            await sessionService.startSession(payload);
            navigate("/focus-page", {
                state: {
                    taskIds,
                    title,
                    source: "planner",
                    plannedDuration: durationSeconds,
                },
            });
        } catch (err) {
            console.error("Failed to start session:", err);
        }
        setShowDurationModal(false);
        setSelectedTasks([]);
    };

    const taskActions = useTaskActions({
        tasks,
        goals,
        setTasks,
        editingTaskTitle,
        setEditingTask,
        taskPlannedDate,
        setEditingTaskDate,
    });

    const sessionActions = useSessionActions({
        setShowDurationModal,
        setTasksToStart,
        setDurationToStart,
        durationToStart,
        tasksToStart,
        setSelectedTasks,
    });

    const goalActions = useGoalActions({
        goals,
        setGoals,
        newGoal,
        setNewGoal,
        setDateEditingGoal,
        setEditingGoal,
        goalStartDate,
        editingGoalTitle,
        goalEndDate,

    });
    const [leftSidebarView, setLeftSidebarView] = useState("timeline");
    return (
        <div className="min-h-screen lg:h-screen bg-background-color text-text-primary p-3 md:p-6 overflow-x-hidden lg:overflow-hidden">
            <div className="max-w-screen mx-auto h-full flex flex-col min-h-0">
                <DurationModal
                    showDurationModal={showDurationModal}
                    setShowDurationModal={setShowDurationModal}
                    durationToStart={durationToStart}
                    setDurationToStart={setDurationToStart}
                    tasksToStart={tasksToStart}
                    confirmStartFocus={confirmStartFocus}
                />
                <div className="shrink-0 space-y-4">
                    <SelectedTasksBar
                        selectedTasks={selectedTasks}
                        setSelectedTasks={setSelectedTasks}
                        tasks={tasks}
                        handleStartFocusButton={sessionActions.handleStartFocusButton}
                    />

                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                        <div className="flex-1">
                            <PlannerHeader />
                        </div>

                        <div className="w-full lg:w-auto lg:max-w-xl">
                            <ActiveSessionBanner
                                activeSession={activeSession}
                                setActiveSession={setActiveSession}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 lg:overflow-hidden mt-4">
                    <div className="lg:col-span-3 flex flex-col gap-4 h-full min-h-0 overflow-hidden">
                        <div className="flex p-1 bg-background-secondary/30 rounded-2xl border border-border-secondary/50 shrink-0">
                            <button
                                onClick={() => setLeftSidebarView("timeline")}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 text-[11px] font-black uppercase tracking-wider transition-all rounded-xl ${leftSidebarView === "timeline"
                                    ? "bg-button-primary text-white shadow-lg shadow-button-primary/20"
                                    : "text-text-muted hover:text-text-primary"
                                    }`}
                            >
                                <Clock size={14} strokeWidth={3} />
                                Timeline
                            </button>
                            <button
                                onClick={() => setLeftSidebarView("goals")}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 text-[11px] font-black uppercase tracking-wider transition-all rounded-xl ${leftSidebarView === "goals"
                                    ? "bg-button-primary text-white shadow-lg shadow-button-primary/20"
                                    : "text-text-muted hover:text-text-primary"
                                    }`}
                            >
                                <Target size={14} strokeWidth={3} />
                                Goals
                            </button>
                        </div>

                        <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
                            <AnimatePresence mode="wait">
                                {leftSidebarView === "timeline" ? (
                                    <motion.div
                                        key="timeline"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                        transition={{ duration: 0.2 }}
                                        className="h-full flex flex-col min-h-0"
                                    >
                                        <Timeline
                                            tasks={tasks}
                                            handleDropTaskToTime={taskActions.handleDropTaskToTime}
                                        />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="goals"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                        transition={{ duration: 0.2 }}
                                        className="h-full flex flex-col min-h-0"
                                    >
                                        <GoalList
                                            goals={goals}
                                            newGoal={newGoal}
                                            setNewGoal={setNewGoal}
                                            handleAddGoal={goalActions.handleAddGoal}
                                            editingGoal={editingGoal}
                                            setEditingGoal={setEditingGoal}
                                            editingGoalTitle={editingGoalTitle}
                                            setEditingGoalTitle={setEditingGoalTitle}
                                            handleEditGoalSave={goalActions.handleEditGoalSave}
                                            dateEditingGoal={dateEditingGoal}
                                            setDateEditingGoal={setDateEditingGoal}
                                            goalStartDate={goalStartDate}
                                            setGoalStartDate={setGoalStartDate}
                                            goalEndDate={goalEndDate}
                                            setGoalEndDate={setGoalEndDate}
                                            handleEditGoalDates={goalActions.handleEditGoalDates}
                                            handleDeleteGoal={goalActions.handleDeleteGoal}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="lg:col-span-5 flex flex-col gap-6 h-auto lg:h-full min-h-0">
                        <div className="shrink-0">
                            <TaskInput
                                goals={goals}
                                handleAddTask={taskActions.handleAddTask}
                            />
                        </div>
                        <div className="flex-1 h-[500px] lg:h-auto lg:min-h-0">
                            <TaskList
                                tasks={tasks}
                                goals={goals}
                                selectedTasks={selectedTasks}
                                setSelectedTasks={setSelectedTasks}
                                handleReorder={taskActions.handleReorder} // need to check this
                                handleToggleStatus={taskActions.handleToggleStatus}
                                handleSetStatus={taskActions.handleSetStatus}
                                handleDeleteTask={taskActions.handleDeleteTask}
                                handleStartFocusButton={sessionActions.handleStartFocusButton}
                                editingTask={editingTask}
                                setEditingTask={setEditingTask}
                                editingTaskTitle={editingTaskTitle}
                                setEditingTaskTitle={setEditingTaskTitle}
                                handleEditTaskSave={taskActions.handleEditTaskSave}
                                editingTaskDate={editingTaskDate}
                                setEditingTaskDate={setEditingTaskDate}
                                taskPlannedDate={taskPlannedDate}
                                setTaskPlannedDate={setTaskPlannedDate}
                                handleEditTaskDateSave={taskActions.handleEditTaskDateSave}
                                sortBy={sortBy}
                                setSortBy={setSortBy}
                                filterByStatus={filterByStatus}
                                setFilterByStatus={setFilterByStatus}
                                filterByGoal={filterByGoal}
                                setFilterByGoal={setFilterByGoal}
                                searchQuery={searchQuery}
                                setSearchQuery={setSearchQuery}
                            />
                        </div>
                    </div>

                    <div className="lg:col-span-4 h-[500px] lg:h-full min-h-0">
                        <div className="bg-card-background border border-card-border rounded-3xl shadow-xl h-full flex flex-col overflow-hidden">
                            <Notes
                                show={true}
                                onClose={() => { }}
                                notes={notes}
                                todos={tasks.map((t) => ({
                                    id: t._id,
                                    title: t.title,
                                    text: t.title,
                                    status: t.status,
                                }))}
                                createNote={createNote}
                                updateNote={updateNote}
                                deleteNote={deleteNote}
                            />
                            <style>{`
                .lg\\:col-span-4 .flex.justify-between.items-center > button { display: none; }
                .lg\\:col-span-4 .overflow-y-auto { flex: 1; min-height: 0; }
              `}</style>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
>>>>>>> Stashed changes

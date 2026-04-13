import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import taskService from "../../../../services/taskService.js";
import goalService from "../../../../services/goalService.js";
import sessionService from "../../../../services/sessionService.js";
import { useNotes } from "../focus/hooks/useNotes.js";
import Notes from "../focus/components/Notes.jsx";
import PlannerHeader from "./components/PlannerHeader.jsx";
import SelectedTasksBar from "./components/SelectedTasksBar.jsx";
import TaskInput from "./components/TaskInput.jsx";
import GoalList from "./components/GoalList.jsx";
import TaskList from "./components/TaskList.jsx";
import Timeline from "./components/Timeline.jsx";
import { useTaskActions } from "./hooks/useTaskActions.js";
import { useSessionActions } from "./hooks/useSessionActions.js";
import { useGoalActions } from "./hooks/useGoalActions.js";
import DurationModal from "./components/DurationModal.jsx";
import ActiveSessionBanner from "./components/ActiveSessionBanner.jsx";
import { Clock, Target } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export default function Planner() {
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
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-[11px] font-black uppercase tracking-wider transition-all rounded-xl ${
                  leftSidebarView === "timeline"
                    ? "bg-button-primary text-white shadow-lg shadow-button-primary/20"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                <Clock size={14} strokeWidth={3} />
                Timeline
              </button>
              <button
                onClick={() => setLeftSidebarView("goals")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-[11px] font-black uppercase tracking-wider transition-all rounded-xl ${
                  leftSidebarView === "goals"
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
                onClose={() => {}}
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

import { useNavigate } from "react-router-dom";
import { usePlannerStore } from "../../../stores/plannerStore.js";
import {
  usePlannerData,
  PlannerHeader,
  TodayPlanView,
  TimelineView,
  TasksView,
  GoalsView,
  NotesView,
  TaskModal,
  GoalModal,
  NoteModal,
  DurationModal,
} from "../../../features/planner";
import { AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button.jsx";
import { Skeleton } from "@/components/ui/skeleton.jsx";

export default function Planner() {
  const navigate = useNavigate();

  const {
    activeTab,
    setActiveTab,
    selectedTaskId,
    setSelectedTaskId,
    selectedGoalId,
    setSelectedGoalId,
    selectedNoteId,
    setSelectedNoteId,
  } = usePlannerStore();

  const {
    isLoading,
    isError,
    refetch,
    activeSession,
    tasks,
    todayTasks,
    activeTasks,
    goals,
    notes,
    modals,
    actions,
  } = usePlannerData();

  if (isError) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[70vh] bg-background">
        <div className="text-center space-y-4 max-w-sm p-6">
          <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">
              Couldn't load planner
            </h2>
            <p className="text-sm text-muted-foreground">
              An error occurred while connecting to Athena services.
            </p>
          </div>
          <Button
            onClick={refetch}
            variant="outline"
            className="rounded-xl font-medium"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-background text-foreground h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 md:px-10 py-8 lg:py-10 space-y-8 pb-24">
        {/* Active Session Alert Banner */}
        {activeSession && (
          <div className="flex items-center justify-between p-4 bg-primary/10 border border-primary/20 rounded-2xl">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Focus Session in Progress: {activeSession.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  An active session is currently running.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => navigate("/focus-page")}
              className="gap-1.5 rounded-xl font-semibold text-xs shadow-xs"
            >
              Resume Session <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}

        {/* 1. Header with View Tabs */}
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-9 w-48 rounded-xl" />
            <Skeleton className="h-10 w-96 rounded-xl" />
          </div>
        ) : (
          <PlannerHeader
            activeTab={activeTab}
            onTabChange={setActiveTab}
            todayCount={todayTasks.length}
            tasksCount={activeTasks.length}
            goalsCount={goals.length}
            notesCount={notes.length}
            onOpenCreateTask={() =>
              actions.openCreateTask(null, activeTab === "today")
            }
            onOpenCreateGoal={actions.openCreateGoal}
          />
        )}

        {/* 2. Active Tab Content */}
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
        ) : (
          <div>
            {activeTab === "today" && (
              <TodayPlanView
                tasks={tasks}
                goals={goals}
                onToggleStatus={actions.toggleTaskStatus}
                onStartFocus={actions.startFocus}
                onAddToToday={actions.addToToday}
                onRemoveFromToday={actions.removeFromToday}
                onEditTask={actions.openEditTask}
                onDeleteTask={actions.deleteTask}
                onOpenCreateTask={() => actions.openCreateTask(null, true)}
              />
            )}

            {activeTab === "timeline" && (
              <TimelineView
                tasks={tasks}
                goals={goals}
                onOpenCreateTask={() => actions.openCreateTask(null, false)}
              />
            )}

            {activeTab === "tasks" && (
              <TasksView
                tasks={tasks}
                goals={goals}
                selectedTaskId={selectedTaskId}
                onSelectTask={setSelectedTaskId}
                onToggleStatus={actions.toggleTaskStatus}
                onStartFocus={actions.startFocus}
                onAddToToday={actions.addToToday}
                onRemoveFromToday={actions.removeFromToday}
                onEditTask={actions.openEditTask}
                onDeleteTask={actions.deleteTask}
                onOpenCreateTask={() => actions.openCreateTask(null, false)}
              />
            )}

            {activeTab === "goals" && (
              <GoalsView
                goals={goals}
                tasks={tasks}
                selectedGoalId={selectedGoalId}
                onSelectGoal={setSelectedGoalId}
                onToggleTaskStatus={actions.toggleTaskStatus}
                onStartFocus={actions.startFocus}
                onEditGoal={actions.openEditGoal}
                onDeleteGoal={actions.deleteGoal}
                onOpenCreateGoal={actions.openCreateGoal}
                onOpenCreateTaskForGoal={(goalId) =>
                  actions.openCreateTask(goalId, false)
                }
              />
            )}

            {activeTab === "notes" && (
              <NotesView
                notes={notes}
                goals={goals}
                tasks={tasks}
                selectedNoteId={selectedNoteId}
                onSelectNote={setSelectedNoteId}
                onCreateNote={actions.saveNote}
                onUpdateNote={actions.saveNote}
                onDeleteNote={actions.deleteNote}
                onOpenCreateNote={actions.openCreateNote}
              />
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <TaskModal
        open={modals.taskModalOpen}
        onOpenChange={modals.setTaskModalOpen}
        task={modals.editingTask}
        goals={goals}
        defaultGoalId={modals.taskDefaultGoalId}
        defaultPlannedToday={modals.taskDefaultPlannedToday}
        onSave={actions.saveTask}
      />

      <GoalModal
        open={modals.goalModalOpen}
        onOpenChange={modals.setGoalModalOpen}
        goal={modals.editingGoal}
        onSave={actions.saveGoal}
      />

      <NoteModal
        open={modals.noteModalOpen}
        onOpenChange={modals.setNoteModalOpen}
        note={modals.editingNote}
        goals={goals}
        tasks={tasks}
        onSave={actions.saveNote}
      />

      <DurationModal
        open={modals.durationModalOpen}
        onOpenChange={modals.setDurationModalOpen}
        tasksToStart={modals.tasksToStart}
        onConfirmStart={actions.confirmStartFocus}
      />
    </div>
  );
}

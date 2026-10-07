import { useState } from "react";
import {
  useTodayData,
  TodayHeader,
  DailyProgress,
  StreakSummary,
  NextAction,
  TodayWork,
  QuickContext,
  TodayInsight,
  TodaySkeleton,
  TodayError,
  DailyCloseoutModal,
} from "../../../features/today";

const UserDashboard = () => {
  const {
    isLoading,
    isError,
    refetch,
    header,
    tasks,
    progress,
    streak,
    insight,
    actions,
  } = useTodayData();

  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isCloseoutOpen, setIsCloseoutOpen] = useState(false);

  if (isError) {
    return <TodayError onRetry={refetch} />;
  }

  return (
    <div className="flex-1 bg-background text-foreground">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 md:px-10 py-8 lg:py-10 space-y-8 pb-24">
        {isLoading ? (
          <TodaySkeleton />
        ) : (
          <>
            {/* 1. Header */}
            <TodayHeader
              greeting={header.greeting}
              currentDate={header.currentDate}
            />

            {/* 2. Daily Overview (Progress & Streak) */}
            <section className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <DailyProgress
                focusMinutes={progress.focusMinutes}
                targetMinutes={progress.targetMinutes}
                progressPercent={progress.progressPercent}
                remainingMinutes={progress.remainingMinutes}
                adaptiveTarget={progress.adaptiveTarget}
                onApplyTarget={actions.handleApplyTarget}
              />
              <StreakSummary
                streakDays={streak.streakDays}
                focusMinutes={streak.focusMinutes}
                targetMinutes={streak.targetMinutes}
              />
            </section>

            {/* 3. Next Action */}
            <NextAction
              nextTask={tasks.nextTask}
              todayTasks={tasks.today}
              completedTasks={tasks.completed}
              goals={tasks.goals}
              onStartFocus={actions.handleStartFocus}
              onOpenQuickAdd={() => setIsAddingTask(true)}
            />

            {/* 4. Today's Work & Quick Context */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <TodayWork
                tasks={tasks.today}
                completedTasks={tasks.completed}
                goals={tasks.goals}
                onToggleStatus={actions.handleToggleTaskStatus}
                onStartFocus={actions.handleStartFocus}
                onQuickAddTask={actions.handleQuickAddTask}
                isAddingTask={isAddingTask}
                setIsAddingTask={setIsAddingTask}
                onOpenCloseout={() => setIsCloseoutOpen(true)}
              />

              <div className="lg:col-span-5 xl:col-span-4 space-y-6">
                <QuickContext
                  targetMinutes={progress.targetMinutes}
                  focusMinutes={progress.focusMinutes}
                  remainingMinutes={progress.remainingMinutes}
                  completedTasksCount={tasks.completed.length}
                  totalTasksCount={tasks.today.length}
                />

                <TodayInsight insight={insight} />
              </div>
            </div>

            {/* 5. Daily Closeout & Rollover Modal */}
            <DailyCloseoutModal
              open={isCloseoutOpen}
              onOpenChange={setIsCloseoutOpen}
              todayTasks={tasks.today}
              completedTasks={tasks.completed}
              progress={progress}
              streak={streak}
              goals={tasks.goals}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
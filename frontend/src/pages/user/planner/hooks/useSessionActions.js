import { useNavigate } from "react-router-dom";
import sessionService from "../../../../../services/sessionService";

export const useSessionActions = ({
  setShowDurationModal,
  setTasksToStart,
  setDurationToStart,
  durationToStart,
  tasksToStart,
  setSelectedTasks
}) => {
  const navigate = useNavigate();

  const handleStartFocusButton = (taskOrTasks) => {
    const arr = Array.isArray(taskOrTasks) ? taskOrTasks : [taskOrTasks];
    setTasksToStart(arr);
    setDurationToStart(25);
    setShowDurationModal(true);
  };

  const confirmStartFocus = async () => {
    const durationSeconds = durationToStart * 60;

    const title =
      tasksToStart.length > 1
        ? `Batch Focus (${tasksToStart.length} tasks)`
        : tasksToStart[0].title;

    const taskIds = tasksToStart.map(t => t._id);

    await sessionService.startSession({
      sessionId: Date.now().toString(),
      title,
      taskIds,
      sessionSegments: [{ type: "focus", duration: 0, totalDuration: durationSeconds }],
      plannedDuration: durationSeconds,
      totalBreakMinutes: 0,
      totalFocusMinutes: 0,
    });

    navigate("/focus-page");
    setShowDurationModal(false);
    setSelectedTasks([]);
  };

  return { handleStartFocusButton, confirmStartFocus };
};
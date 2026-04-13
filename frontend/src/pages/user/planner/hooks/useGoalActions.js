import goalService from "../../../../../services/goalService";

export const useGoalActions = ({
  goals,
  setGoals,
  newGoal,
  setNewGoal,
  setDateEditingGoal,
  setEditingGoal,
  goalStartDate,
  editingGoalTitle,
  goalEndDate,
}) => {
  const handleAddGoal = async () => {
    if (!newGoal.trim()) return;
    try {
      const createdGoal = await goalService.createGoal({ title: newGoal });
      setGoals((prev) => [createdGoal, ...prev]);
      setNewGoal("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteGoal = async (goalId) => {
    const prevGoals = goals;
    setGoals((prev) => prev.filter((g) => g._id !== goalId));

    try {
      await goalService.deleteGoal(goalId);
    } catch (err) {
      setGoals(prevGoals);
      console.error(err);
    }
  };

  const handleEditGoalDates = async (goalId) => {
    try {
      const updates = {};
      if (goalStartDate) updates.startDate = new Date(goalStartDate + "T00:00:00");
      if (goalEndDate) updates.dueDate = new Date(goalEndDate + "T23:59:59");
      if (Object.keys(updates).length > 0) {
        setGoals((prev) =>
          prev.map((g) => (g._id === goalId ? { ...g, ...updates } : g)),
        );
        await goalService.updateGoal(goalId, updates);
      }
    } catch (err) {
      console.error(err);
    }
    setDateEditingGoal(null);
  };

  const handleEditGoalSave = async (goalId) => {
   if (!editingGoalTitle.trim()) {
      setEditingGoal(null);
      return;
    }
    try {
      setGoals((prev) =>
        prev.map((g) =>
          g._id === goalId ? { ...g, title: editingGoalTitle } : g,
        ),
      );
      await goalService.updateGoal(goalId, { title: editingGoalTitle });
    } catch (err) {
      console.error(err);
    }
    setEditingGoal(null);
  };

  return {
    handleAddGoal,
    handleDeleteGoal,
    handleEditGoalDates,
    handleEditGoalSave,
  };
};

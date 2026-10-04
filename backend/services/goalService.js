import goalRepository from "../repositories/goalRepository.js";
import taskRepository from "../repositories/taskRepository.js";

class GoalService {
  async createGoal(userId, data) {
    const { user, _id, ...safeData } = data;
    return goalRepository.create(userId, safeData);
  }

  async getGoals(userId) {
    return goalRepository.findByUserId(userId);
  }

  async getGoalById(userId, goalId) {
    return goalRepository.findById(userId, goalId);
  }

  async updateGoal(userId, goalId, data) {
    const { user, _id, ...updateData } = data;
    return goalRepository.update(userId, goalId, updateData);
  }

  async deleteGoal(userId, goalId) {
    return goalRepository.delete(userId, goalId);
  }

  async recalculateProgress(goalId) {
    const pgTasks = await taskRepository.findByGoalId(goalId);
    if (pgTasks && pgTasks.length > 0) {
      const completed = pgTasks.filter((t) => t.status === "completed").length;
      const progress = Math.round((completed / pgTasks.length) * 100);
      await goalRepository.updateProgress(goalId, progress);
      return;
    }
    await goalRepository.updateProgress(goalId, 0).catch(() => null);
  }
}

export default new GoalService();
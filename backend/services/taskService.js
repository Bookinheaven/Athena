import { getStartOfDay } from "../utils/streakHelpers.js";
import GoalService from "./goalService.js";
import Task from "../models/taskModel.js";

class TaskService {
  async createTask(userId, data) {
    const { user, _id, ...safeData } = data;
    const task = await Task.create({
      ...safeData,
      user: userId,
    });
    if (task.goal) {
      await GoalService.recalculateProgress(task.goal);
    }

    return task;
  }

  async getTasks(userId) {
    const today = getStartOfDay()

    // const tomorrow = new Date(today);
    // tomorrow.setDate(today.getDate() + 1);

    const tasks = await Task.find({
      user: userId,
      // dueDate: { $gte: today, $lt: tomorrow }
    }).sort({ order: 1 });
    return tasks;
  }

  async updateTask(userId, taskId, data) {
    const { user, _id, ...updateData } = data;
    const task = await Task.findOneAndUpdate(
      { _id: taskId, user: userId },
      { $set: updateData },
      { new: true }
    );

    if (task?.goal) {
      await GoalService.recalculateProgress(task.goal);
    }

    return task;
  }

  async deleteTask(userId, taskId) {
    const task = await Task.findOneAndDelete({
      _id: taskId,
      user: userId,
    });

    if (task?.goal) {
      await GoalService.recalculateProgress(task.goal);
    }

    return task;
  }

  async reorderTasks(userId, updates) {
    const bulkOps = updates.map((u) => ({
      updateOne: {
        filter: { _id: u.taskId, user: userId },
        update: { order: u.order },
      },
    }));

    await Task.bulkWrite(bulkOps);
  }
}

export default new TaskService();
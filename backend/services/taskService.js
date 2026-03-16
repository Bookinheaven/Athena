import Task from "../models/taskModel.js";
import GoalService from "./goalService.js";

class TaskService {
  async createTask(userId, data) {
    const task = await Task.create({
      user: userId,
      ...data,
    });

    if (task.goal) {
      await GoalService.recalculateProgress(task.goal);
    }

    return task;
  }

  async getTasks(userId) {
    return Task.find({ user: userId }).sort({ order: 1 });
  }

  async updateTask(userId, taskId, data) {
    const task = await Task.findOneAndUpdate(
      { _id: taskId, user: userId },
      data,
      { new: true }
    );

    if (task.goal) {
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
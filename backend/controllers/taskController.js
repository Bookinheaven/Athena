import TaskService from "../services/taskService.js";

class TaskController {
  async createTask(req, res) {
    try {
      const task = await TaskService.createTask(
        req.user.id,
        req.body,
        new Date(),
        req.timezone
      );

      res.status(201).json(task);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ success: false, message: error.message });
    }
  }

  async getTasks(req, res) {
    try {
      const tasks = await TaskService.getTasks(req.user.id);

      res.json(tasks);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ success: false, message: error.message });
    }
  }

  async updateTask(req, res) {
    try {
      const task = await TaskService.updateTask(
        req.user.id,
        req.params.id,
        req.body,
        new Date(),
        req.timezone
      );

      res.json(task);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ success: false, message: error.message });
    }
  }

  async deleteTask(req, res) {
    try {
      const userId = req.user.id;
      await TaskService.deleteTask(userId, req.params.id, new Date(), req.timezone);

      res.json({ success: true, message: "Task deleted" });
    } catch (error) {
      if (error.code === "23503") {
        return res.status(409).json({
          success: false,
          message: "Task cannot be deleted because it has historical records.",
        });
      }
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ success: false, message: error.message });
    }
  }

  async reorderTasks(req, res) {
    try {
      await TaskService.reorderTasks(req.user.id, req.body);

      res.json({ success: true, message: "Tasks reordered" });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ success: false, message: error.message });
    }
  }

  async getTaskFriction(req, res) {
    try {
      const result = await TaskService.getTaskFriction(req.user.id, req.params.id);
      res.json({ success: true, friction: result, data: result });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ success: false, message: error.message });
    }
  }
}

export default new TaskController();
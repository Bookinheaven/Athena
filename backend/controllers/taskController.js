import TaskService from "../services/taskService.js";

class TaskController {
  async createTask(req, res) {
    try {
      const task = await TaskService.createTask(req.user.id, req.body);

      res.status(201).json(task);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async getTasks(req, res) {
    try {
      const tasks = await TaskService.getTasks(req.user.id);

      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async updateTask(req, res) {
    try {
      const task = await TaskService.updateTask(
        req.user.id,
        req.params.id,
        req.body
      );

      res.json(task);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async deleteTask(req, res) {
    try {
      await TaskService.deleteTask(req.user.id, req.params.id);

      res.json({ message: "Task deleted" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async reorderTasks(req, res) {
    try {
      await TaskService.reorderTasks(req.user.id, req.body);

      res.json({ message: "Tasks reordered" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

export default new TaskController();
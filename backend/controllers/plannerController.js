import Goal from "../models/goalModel.js";
import Task from "../models/taskModel.js";
import Note from "../models/notesModel.js";

class PlannerController {
  async getPlannerData(req, res) {
    try {
      const userId = req.user.id;

      const [goals, tasks, notes] = await Promise.all([
        Goal.find({ user: userId }).sort({ createdAt: -1 }),
        Task.find({ user: userId }).sort({ order: 1 }),
        Note.find({ user: userId }).sort({ updatedAt: -1 }),
      ]);

      res.json({
        goals,
        tasks,
        notes,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

export default new PlannerController();
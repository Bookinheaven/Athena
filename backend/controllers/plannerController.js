import goalRepository from "../repositories/goalRepository.js";
import taskRepository from "../repositories/taskRepository.js";
import notesRepository from "../repositories/notesRepository.js";

class PlannerController {
  async getPlannerData(req, res) {
    try {
      const userId = req.user?.id || req.user?._id;

      const [goals, tasks, notes] = await Promise.all([
        goalRepository.findByUserId(userId),
        taskRepository.findByUserId(userId),
        notesRepository.findByUserId(userId),
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
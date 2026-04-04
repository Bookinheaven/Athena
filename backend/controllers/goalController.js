import GoalService from "../services/goalService.js";

class GoalController {
  async createGoal(req, res) {
    try {
      const goal = await GoalService.createGoal(req.user.id, req.body);

      res.status(201).json(goal);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async getGoals(req, res) {
    try {
      const goals = await GoalService.getGoals(req.user.id);

      res.json(goals);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async getGoal(req, res) {
    try {
      const goal = await GoalService.getGoalById(
        req.user.id,
        req.params.id
      );

      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }

      res.json(goal);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async updateGoal(req, res) {
    try {
      const goal = await GoalService.updateGoal(
        req.user.id,
        req.params.id,
        req.body
      );

      res.json(goal);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async deleteGoal(req, res) {
    try {
      await GoalService.deleteGoal(req.user.id, req.params.id);

      res.json({ message: "Goal deleted" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

export default new GoalController();
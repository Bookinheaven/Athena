import ScheduleService from "../services/scheduleService.js";

class ScheduleController {
  async createScheduleBlock(req, res) {
    try {
      const block = await ScheduleService.createScheduleBlock(
        req.user.id,
        req.body
      );
      res.status(201).json(block);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ message: error.message });
    }
  }

  async getScheduleBlocks(req, res) {
    try {
      const blocks = await ScheduleService.getScheduleBlocks(
        req.user.id,
        req.query
      );
      res.json(blocks);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ message: error.message });
    }
  }

  async getScheduleBlockById(req, res) {
    try {
      const block = await ScheduleService.getScheduleBlockById(
        req.user.id,
        req.params.id
      );
      res.json(block);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ message: error.message });
    }
  }

  async updateScheduleBlock(req, res) {
    try {
      const block = await ScheduleService.updateScheduleBlock(
        req.user.id,
        req.params.id,
        req.body
      );
      res.json(block);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ message: error.message });
    }
  }

  async deleteScheduleBlock(req, res) {
    try {
      await ScheduleService.deleteScheduleBlock(req.user.id, req.params.id);
      res.json({ message: "Schedule block deleted" });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ message: error.message });
    }
  }
}

export default new ScheduleController();

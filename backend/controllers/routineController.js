import routineService from "../services/routineService.js";

class RoutineController {
  async getRoutines(req, res) {
    try {
      const routines = await routineService.listRoutines(req.user.id, {
        status: req.query.status,
        includeArchived: req.query.includeArchived === "true",
      });
      res.json(routines);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ success: false, message: error.message });
    }
  }

  async getRoutineById(req, res) {
    try {
      const routine = await routineService.getRoutineById(req.user.id, req.params.id);
      res.json(routine);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ success: false, message: error.message });
    }
  }

  async createRoutine(req, res) {
    try {
      const routine = await routineService.createRoutine(
        req.user.id,
        req.body,
        req.timezone
      );
      res.status(201).json(routine);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ success: false, message: error.message });
    }
  }

  async updateRoutine(req, res) {
    try {
      const routine = await routineService.updateRoutine(
        req.user.id,
        req.params.id,
        req.body,
        req.timezone
      );
      res.json(routine);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ success: false, message: error.message });
    }
  }

  async updateStatus(req, res) {
    try {
      const { status } = req.body;
      const routine = await routineService.updateStatus(
        req.user.id,
        req.params.id,
        status,
        req.timezone
      );
      res.json(routine);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ success: false, message: error.message });
    }
  }

  async deleteRoutine(req, res) {
    try {
      await routineService.deleteRoutine(req.user.id, req.params.id, req.timezone);
      res.json({ success: true, message: "Routine deleted" });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ success: false, message: error.message });
    }
  }

  async getTodayOccurrences(req, res) {
    try {
      const occurrences = await routineService.getTodayOccurrences(
        req.user.id,
        new Date(),
        req.timezone
      );
      res.json(occurrences);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ success: false, message: error.message });
    }
  }

  async getOccurrencesByDate(req, res) {
    try {
      const { date } = req.query;
      if (!date) {
        return res.status(400).json({ success: false, message: "Query parameter 'date' is required (YYYY-MM-DD)" });
      }
      const occurrences = await routineService.ensureOccurrencesForDate(
        req.user.id,
        date,
        req.timezone
      );
      res.json(occurrences);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ success: false, message: error.message });
    }
  }

  async completeStep(req, res) {
    try {
      const isCompleted = req.body.isCompleted !== false;
      const occurrence = await routineService.completeStep(
        req.user.id,
        req.params.occurrenceId,
        req.params.stepOccurrenceId,
        isCompleted
      );
      res.json(occurrence);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ success: false, message: error.message });
    }
  }

  async skipOccurrence(req, res) {
    try {
      const occurrence = await routineService.skipOccurrence(
        req.user.id,
        req.params.occurrenceId
      );
      res.json(occurrence);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ success: false, message: error.message });
    }
  }
}

export default new RoutineController();

import express from "express";
import auth from "../middlewares/authMiddleware.js";
import routineController from "../controllers/routineController.js";

const router = express.Router();

// All routine endpoints require authentication
router.use(auth);

// Routine Occurrences
router.get("/occurrences/today", routineController.getTodayOccurrences);
router.get("/occurrences", routineController.getOccurrencesByDate);
router.put(
  "/occurrences/:occurrenceId/steps/:stepOccurrenceId/complete",
  routineController.completeStep
);
router.patch(
  "/occurrences/:occurrenceId/steps/:stepOccurrenceId/complete",
  routineController.completeStep
);
router.put("/occurrences/:occurrenceId/skip", routineController.skipOccurrence);
router.post("/occurrences/:occurrenceId/skip", routineController.skipOccurrence);

// Routine Definitions CRUD
router.get("/", routineController.getRoutines);
router.post("/", routineController.createRoutine);
router.get("/:id", routineController.getRoutineById);
router.put("/:id", routineController.updateRoutine);
router.patch("/:id", routineController.updateRoutine);
router.patch("/:id/status", routineController.updateStatus);
router.put("/:id/status", routineController.updateStatus);
router.delete("/:id", routineController.deleteRoutine);

export default router;

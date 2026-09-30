import express from "express";
import auth from "../middlewares/authMiddleware.js";
import taskOccurrenceController from "../controllers/taskOccurrenceController.js";

const router = express.Router();

router.use(auth);

router.get("/", taskOccurrenceController.getOccurrences);
router.post("/", taskOccurrenceController.createOccurrence);
router.patch("/:id/outcome", taskOccurrenceController.updateOutcome);
router.post("/:id/reschedule", taskOccurrenceController.rescheduleOccurrence);

export default router;

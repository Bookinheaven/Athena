import express from "express";
import auth from '../middlewares/authMiddleware.js';
import sessionController from "../controllers/sessionController.js";
const router = express.Router();

router.post("/", auth, sessionController.startSession);
router.patch("/:id", auth, sessionController.updateSession);
router.post("/:id/feedback", auth, sessionController.feedbackSession);

router.get("/active", auth, sessionController.getActiveSession);

router.get("/all", auth, sessionController.getSessions);

router.get("/insights", auth, sessionController.getInsights);
router.get("/today", auth, sessionController.getTodaysInsights);

export default router;
import express from "express";
import { startSession, updateSession, submitFeedback, getSessions, getInsights, getActiveSession, getTodaysInsights } from "../controllers/sessionController.js";
import auth from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post("/", auth, startSession);
router.patch("/:id", auth, updateSession);
router.post("/:id/feedback", auth, submitFeedback);

router.get("/active", auth, getActiveSession);

router.get("/all", auth, getSessions);

router.get("/insights", auth, getInsights);
router.get("/today", auth, getTodaysInsights);

export default router;
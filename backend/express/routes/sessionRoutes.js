import express from "express";
import { logSession, getSessions, getInsights, getCurrentSession } from "../controllers/sessionController.js";
import auth from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post("/save", auth, logSession);

router.get("/getAll", auth, getSessions);

router.get("/getCurrent", auth, getCurrentSession);

router.get("/insights", auth, getInsights);

export default router;
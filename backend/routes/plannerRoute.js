import express from "express";
import plannerController from "../controllers/plannerController.js";
import auth from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", auth, plannerController.getPlannerData);

export default router;
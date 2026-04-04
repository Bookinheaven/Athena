import express from "express";
import goalController from "../controllers/goalController.js";
import auth from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(auth);

router.get("/", goalController.getGoals);
router.post("/", goalController.createGoal);

router.get("/:id", goalController.getGoal);
router.patch("/:id", goalController.updateGoal);
router.delete("/:id", goalController.deleteGoal);

export default router;
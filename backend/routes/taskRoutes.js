import express from "express";
import taskController from "../controllers/taskController.js";
import auth from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(auth);

router.get("/", taskController.getTasks);
router.post("/", taskController.createTask);

router.patch("/reorder", taskController.reorderTasks);

router.patch("/:id", taskController.updateTask);
router.delete("/:id", taskController.deleteTask);

export default router;
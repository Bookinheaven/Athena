import express from "express";
import scheduleController from "../controllers/scheduleController.js";
import auth from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(auth);

router.get("/", scheduleController.getScheduleBlocks);
router.get("/capacity", scheduleController.getCapacityAlert);
router.post("/", scheduleController.createScheduleBlock);
router.get("/:id", scheduleController.getScheduleBlockById);
router.patch("/:id", scheduleController.updateScheduleBlock);
router.delete("/:id", scheduleController.deleteScheduleBlock);

export default router;

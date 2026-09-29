import express from "express";
import auth from "../middlewares/authMiddleware.js";
import userController from "../controllers/userController.js";
import { profileUpdateValidation } from "../middlewares/validation.js";

const router = express.Router();

router.get("/profile", auth, userController.getProfile);
router.patch("/profile", auth, profileUpdateValidation, userController.updateProfile);

router.get("/settings", auth, userController.getSettings);
router.get("/settings/:type", auth, userController.getSettings);

router.patch("/settings", auth, userController.updateSettings);
router.patch("/settings/:type", auth, userController.updateSettings);

router.post("/settings/reset", auth, userController.resetSettings);
router.post("/settings/:type/reset", auth, userController.resetSettings);

export default router;
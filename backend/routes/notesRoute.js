import express from "express";
import notesController from "../controllers/notesController.js";
import auth from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(auth);

router.get("/", notesController.getNotes);
router.post("/", notesController.createNote);

// router.get("/:id", notesController);
router.patch("/:id", notesController.updateNote);
router.delete("/:id", notesController.deleteNote);

export default router;
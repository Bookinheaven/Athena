import express from "express"
import auth from '../middlewares/authMiddleware.js'
import { getQuotes } from "../controllers/generalController.js";

const router = express.Router();

router.get("/motivational", auth, getQuotes)

export default router;
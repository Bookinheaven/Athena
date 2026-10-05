import env from "./config/env.js";
import express from "express";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import cors from "cors";
import { APP_NAME } from "./config/branding.js";

// Routers
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import sessionRoutes from "./routes/sessionRoutes.js";
import generalRoutes from "./routes/generalRoutes.js";
import streakRoutes from "./routes/streakRoutes.js";
import notesRoutes from "./routes/notesRoute.js";
import plannerRoutes from "./routes/plannerRoute.js";
import goalRoutes from "./routes/goalRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import scheduleRoutes from "./routes/scheduleRoutes.js";
import taskOccurrenceRoutes from "./routes/taskOccurrenceRoutes.js";

const isTest = env.NODE_ENV === "test";

// Rate limiters (relaxed in test environment)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 10000 : 100,
  message: {
    success: false,
    message: "Too many auth attempts. Try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 10000 : 200,
  message: {
    success: false,
    message: "Too many requests. Please slow down.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const heavyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 20000 : 1000,
  message: {
    success: false,
    message: "Too many session updates.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const app = express();

app.use(
  cors({
    origin: Array.from(new Set([env.CLIENT_URL, "http://localhost:5173", "http://localhost:3000"])),
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: `${APP_NAME} API is running!`,
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/session", heavyLimiter, sessionRoutes);
app.use("/api/user", apiLimiter, userRoutes);
app.use("/api/admin", apiLimiter, adminRoutes);
app.use("/api/general", apiLimiter, generalRoutes);
app.use("/api/streak", apiLimiter, streakRoutes);
app.use("/api/notes", apiLimiter, notesRoutes);
app.use("/api/goal", apiLimiter, goalRoutes);
app.use("/api/task", apiLimiter, taskRoutes);
app.use("/api/planner", apiLimiter, plannerRoutes);
app.use("/api/schedule-block", apiLimiter, scheduleRoutes);
app.use("/api/schedule-blocks", apiLimiter, scheduleRoutes);
app.use("/api/task-occurrences", apiLimiter, taskOccurrenceRoutes);

// Error handling middleware with PostgreSQL error code translation
app.use((err, req, res, next) => {
  // PostgreSQL Error Translation
  if (err.code === "23505") {
    // Unique violation
    return res.status(409).json({
      success: false,
      message: "A resource with this identifier or unique property already exists.",
    });
  }
  if (err.code === "23503") {
    // Foreign key violation
    return res.status(400).json({
      success: false,
      message: "Referenced related resource does not exist or cannot be modified.",
    });
  }
  if (err.code === "23514") {
    // Check violation
    return res.status(400).json({
      success: false,
      message: "Data validation error.",
    });
  }
  if (err.code === "22P02") {
    // Invalid text representation (e.g. invalid UUID format)
    return res.status(400).json({
      success: false,
      message: "Invalid ID or input format.",
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    success: false,
    message:
      env.NODE_ENV === "production" && statusCode === 500
        ? "Something went wrong!"
        : err.message,
  });
});

export default app;

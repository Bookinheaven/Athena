import env from "./config/env.js";
import http from "http";
import app from "./app.js";
import { APP_NAME } from "./config/branding.js";
import { getPgPool, closePgPool } from "./db/index.js";
import { initSocket } from "./config/socket.js";

const PORT = env.PORT || 5000;

const startServer = async () => {
  // 1. Verify PostgreSQL core primary datastore
  try {
    const pool = getPgPool();
    await pool.query("SELECT 1;");
    console.log("[PostgreSQL] Primary core datastore connected successfully.");
  } catch (pgErr) {
    console.error("[PostgreSQL] FATAL: Failed to connect to core PostgreSQL database:", pgErr.message);
    process.exit(1);
  }

  const server = http.createServer(app);
  initSocket(server);

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`${APP_NAME} Backend ready!`);
    console.log(`Environment: ${env.NODE_ENV}`);
  });

  const gracefulShutdown = async () => {
    console.log("Shutting down gracefully...");
    await closePgPool();
    process.exit(0);
  };

  process.on("SIGINT", gracefulShutdown);
  process.on("SIGTERM", gracefulShutdown);
};

startServer();

export { app, startServer };

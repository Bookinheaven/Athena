import { migrate } from "drizzle-orm/node-postgres/migrator";
import { getDrizzleDb, closePgPool } from "./index.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations() {
  const db = getDrizzleDb();
  console.log("Applying PostgreSQL migrations from db/migrations...");
  await migrate(db, {
    migrationsFolder: path.resolve(__dirname, "./migrations"),
  });
  console.log("Migrations applied successfully.");
}

// Execute if run directly from CLI
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  try {
    await runMigrations();
    await closePgPool();
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    await closePgPool();
    process.exit(1);
  }
}

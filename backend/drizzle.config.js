import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "./.env") });

export default defineConfig({
  schema: "./db/schema/index.js",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ||
      "postgresql://postgres:postgres@localhost:5432/athena",
  },
  verbose: true,
  strict: true,
});

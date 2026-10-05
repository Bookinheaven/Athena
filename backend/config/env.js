import { z } from "zod";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend/.env before validation
dotenv.config({ path: path.resolve(__dirname, "../.env"), quiet: true });

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"], {
      error: "NODE_ENV must be one of: development, production, test",
    })
    .default("development"),
  PORT: z
    .coerce
    .number({
      error: "PORT must be a valid number",
    })
    .int("PORT must be an integer")
    .positive("PORT must be a positive integer")
    .default(5000),
  DATABASE_URL: z
    .string()
    .refine(
      (val) => !val || val.startsWith("postgresql://") || val.startsWith("postgres://"),
      "DATABASE_URL must start with postgresql:// or postgres://"
    )
    .default("postgresql://postgres:postgres@localhost:5432/athena"),
  JWT_SECRET: z
    .string({
      error: "JWT_SECRET is required",
    })
    .min(1, "JWT_SECRET is required"),
  JWT_EXPIRES_IN: z
    .string()
    .default("7d"),
  CLIENT_URL: z
    .url({
      string: "CLIENT_URL must be a valid URL",
      error: "CLIENT_URL must be a valid URL string",
    })
    .default("http://localhost:5173"),
  APP_NAME: z
    .string()
    .default("Athena"),
  COMPANY_NAME: z
    .string()
    .default("Athena Productivity Labs"),
  BREVO_API_KEY: z
    .string({
      error: "BREVO_API_KEY must be a string",
    })
    .optional()
    .default(""),
  BREVO_SENDER_EMAIL: z
    .union([
      z.email("BREVO_SENDER_EMAIL must be a valid email address"),
      z.literal(""),
    ], {
      error: "BREVO_SENDER_EMAIL must be a valid email address",
    })
    .optional()
    .default(""),
  API_NINJAS: z
    .string()
    .optional()
    .default(""),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  const formattedErrors = result.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  console.error("Backend environment configuration error:\n" + formattedErrors);
  process.exit(1);
}

export const isTestEnvironment = () => {
  return (
    process.env.NODE_ENV === "test" ||
    process.env.npm_lifecycle_event === "test" ||
    process.execArgv.includes("--test") ||
    process.argv.some(
      (arg) => typeof arg === "string" && (arg.includes(".test.js") || arg.includes("--test"))
    )
  );
};

export const env = Object.freeze(result.data);
export default env;

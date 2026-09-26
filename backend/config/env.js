import { z } from "zod";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env before schema validation
dotenv.config({ path: path.resolve(__dirname, "../.env"), quiet: true });

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z
    .coerce
    .number()
    .int()
    .positive()
    .default(5000),
  MONGODB_URI: z
    .string()
    .min(1, "MONGODB_URI is required")
    .refine(
      (val) => val.startsWith("mongodb://") || val.startsWith("mongodb+srv://"),
      "MONGODB_URI must start with mongodb:// or mongodb+srv://"
    ),
  JWT_SECRET: z
    .string()
    .min(1, "JWT_SECRET is required"),
  JWT_EXPIRES_IN: z
    .string()
    .default("7d"),
  CLIENT_URL: z
    .string()
    .url("CLIENT_URL must be a valid URL")
    .default("http://localhost:5173"),
  APP_NAME: z
    .string()
    .default("Athena"),
  COMPANY_NAME: z
    .string()
    .default("Athena Productivity Labs"),
  EMAIL_USER: z
    .string()
    .optional()
    .default(""),
  EMAIL_PASS: z
    .string()
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
  console.error("❌ Invalid backend environment configuration:\n" + formattedErrors);
  process.exit(1);
}

export const env = Object.freeze(result.data);
export default env;

import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const result = dotenv.config({ path: path.join(__dirname, "../.env") , quiet: false});

if (result.error) {
  console.error("Failed to load .env file:", result.error);
  process.exit(1); 
}

// const requiredVars = ["DB_HOST", "DB_USER", "DB_PASS"]; 
// const missing = requiredVars.filter(v => !process.env[v]);

// if (missing.length > 0) {
//   console.error("Missing required environment variables:", missing.join(", "));
//   process.exit(1); 
// }

console.log("Environment variables loaded successfully");

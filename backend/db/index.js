import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import env from "../config/env.js";
import * as schema from "./schema/index.js";

const { Pool, types } = pg;

// Parse PostgreSQL DATE columns (oid 1082) as raw "YYYY-MM-DD" strings to prevent local timezone shifts
types.setTypeParser(1082, (val) => val);

let pool = null;
let db = null;

// Get or initialize the PostgreSQL connection pool
export const getPgPool = () => {
  if (!pool) {
    const connectionString = env.DATABASE_URL || process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("PostgreSQL configuration error: DATABASE_URL is not set.");
    }

    pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on("error", (err) => {
      console.error("Unexpected error on idle PostgreSQL client:", err.message);
    });
  }
  return pool;
};

// Get or initialize the Drizzle ORM client
export const getDrizzleDb = () => {
  if (!db) {
    const clientPool = getPgPool();
    db = drizzle(clientPool, { schema });
  }
  return db;
};

// Close PostgreSQL connection pool (useful for graceful shutdown or tests)
export const closePgPool = async () => {
  if (pool) {
    await pool.end();
    pool = null;
    db = null;
  }
};

export { schema };
export default getDrizzleDb;

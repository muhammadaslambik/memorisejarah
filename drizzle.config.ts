import { defineConfig } from "drizzle-kit";
// drizzle-kit tidak membaca .env.local otomatis, jadi dimuat manual (Node 20.12+)
try { process.loadEnvFile(".env.local"); } catch {}
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
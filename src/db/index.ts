import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// HTTP driver Neon: cocok untuk Cloudflare Workers/Edge (tanpa koneksi TCP)
export const db = () => drizzle(neon(process.env.DATABASE_URL!), { schema });
export * from "./schema";

// Membuat akun admin + kategori awal. Jalankan: npm run db:seed
import { db, users, categories } from "../src/db";
import { hashPassword } from "../src/lib/password";

async function main() {
  const d = db();
  await d.insert(users).values({
    email: process.env.ADMIN_EMAIL!, name: "Admin",
    passwordHash: await hashPassword(process.env.ADMIN_PASSWORD!),
  }).onConflictDoNothing();
  await d.insert(categories).values([
    { name: "Nusantara", slug: "nusantara" }, { name: "Dunia", slug: "dunia" }, { name: "Tokoh", slug: "tokoh" },
  ]).onConflictDoNothing();
  console.log("Seed selesai.");
}
main().catch((e) => { console.error(e); process.exit(1); });
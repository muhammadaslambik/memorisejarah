import { eq } from "drizzle-orm";
import { db, settings } from "@/db";

export async function getSetting(key: string) {
  const [r] = await db().select().from(settings).where(eq(settings.key, key)).limit(1);
  return r?.value ?? null;
}
export async function setSetting(key: string, value: string) {
  await db().insert(settings).values({ key, value }).onConflictDoUpdate({ target: settings.key, set: { value } });
}
// Pendaftaran publik: tertutup kecuali admin membukanya
export async function registrationOpen() {
  return (await getSetting("registration_open")) === "1";
}

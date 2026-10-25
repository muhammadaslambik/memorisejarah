"use server";
import { redirect } from "next/navigation";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db, posts, users } from "@/db";
import { requireReviewer } from "./auth";

const back = (q: string): never => redirect(`/admin/persetujuan?${q}`);

// Satu formulir untuk tiga tombol: setujui, setujui + percayai penulis, kembalikan ke draft
export async function reviewPosts(fd: FormData) {
  await requireReviewer();
  const ids = fd.getAll("ids").map(Number).filter((n) => Number.isInteger(n) && n > 0);
  const act = String(fd.get("do") ?? "");
  if (!ids.length) back("error=kosong");
  const pending = and(inArray(posts.id, ids), eq(posts.status, "pending"));
  if (act === "reject") {
    await db().update(posts).set({ status: "draft", updatedAt: new Date() }).where(pending);
    back("ok=ditolak");
  }
  if (act === "approve" || act === "approve_trust") {
    const rows = await db().select({ authorId: posts.authorId }).from(posts).where(pending);
    await db().update(posts).set({
      status: "published",
      publishedAt: sql`coalesce(${posts.publishedAt}, now())`,
      updatedAt: new Date(),
    }).where(pending);
    if (act === "approve_trust") {
      const authors = [...new Set(rows.map((r) => r.authorId).filter((x): x is number => x !== null))];
      if (authors.length) await db().update(users).set({ trusted: true }).where(and(inArray(users.id, authors), eq(users.role, "penulis")));
    }
    back(act === "approve_trust" ? "ok=disetujui-percaya" : "ok=disetujui");
  }
  back("error=aksi");
}

// Beri atau cabut status tepercaya (bebas posting tanpa persetujuan)
export async function setTrusted(fd: FormData) {
  await requireReviewer();
  const id = Number(fd.get("id"));
  await db().update(users).set({ trusted: fd.get("trusted") === "1" }).where(and(eq(users.id, id), eq(users.role, "penulis")));
  back(fd.get("trusted") === "1" ? "ok=percaya" : "ok=cabut");
}

import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, posts, users } from "@/db";
import { deletePost, logout } from "@/lib/actions";
import { canDeletePost, isReviewer, requireUser, ROLE_LABEL, type Role } from "@/lib/auth";
import { DeleteButton } from "@/components/DeleteButton";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const me = await requireUser();
  // Penulis hanya melihat artikelnya sendiri; admin dan editor melihat semua
  const rows = await db().select({ post: posts, author: users.name }).from(posts)
    .leftJoin(users, eq(posts.authorId, users.id)).orderBy(desc(posts.updatedAt));
  const list = rows.filter((r) => me.role !== "penulis" || r.post.authorId === me.id);
  const pendingCount = list.filter((r) => r.post.status === "pending").length;
  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl">Artikel</h1>
          <p className="text-sm text-charcoal/60">{me.name} · {ROLE_LABEL[me.role as Role]}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/artikel/baru" className="rounded bg-gold px-4 py-2 text-white">+ Artikel Baru</Link>
          {isReviewer(me.role) && (
            <Link href="/admin/persetujuan" className="rounded border px-4 py-2">
              Persetujuan{pendingCount > 0 ? ` (${pendingCount})` : ""}
            </Link>
          )}
          {me.role === "admin" && <Link href="/admin/pengguna" className="rounded border px-4 py-2">Pengguna</Link>}
          <Link href="/admin/akun" className="rounded border px-4 py-2">Akun Saya</Link>
          <form action={logout}><button className="rounded border px-4 py-2">Keluar</button></form>
        </div>
      </div>
      <ul className="mt-6 divide-y divide-cream-dark rounded bg-white/70">
        {list.map(({ post: p, author }) => (
          <li key={p.id} className="flex items-center justify-between gap-3 p-4">
            <div>
              <Link href={`/admin/artikel/${p.id}`} className="font-medium hover:text-gold-dark">{p.title}</Link>
              <span className="ml-2 rounded bg-cream-dark px-2 py-0.5 text-xs">{p.status === "pending" ? "menunggu persetujuan" : p.status}</span>
              {p.status === "draft" && p.reviewNote && <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">ada catatan editor</span>}
              {me.role !== "penulis" && author && <span className="ml-2 text-xs text-charcoal/50">oleh {author}</span>}
            </div>
            {canDeletePost(me, p) && (
              <form action={deletePost}>
                <input type="hidden" name="id" value={p.id} />
                <DeleteButton title={p.title} />
              </form>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

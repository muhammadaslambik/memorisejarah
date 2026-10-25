import Link from "next/link";
import { desc } from "drizzle-orm";
import { db, posts } from "@/db";
import { deletePost, logout } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { DeleteButton } from "@/components/DeleteButton";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const me = await requireUser();
  const list = await db().select().from(posts).orderBy(desc(posts.updatedAt));
  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl">Artikel</h1>
          <p className="text-sm text-charcoal/60">{me.name} · {me.role}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/artikel/baru" className="rounded bg-gold px-4 py-2 text-white">+ Artikel Baru</Link>
          {me.role === "admin" && <Link href="/admin/pengguna" className="rounded border px-4 py-2">Pengguna</Link>}
          <form action={logout}><button className="rounded border px-4 py-2">Keluar</button></form>
        </div>
      </div>
      <ul className="mt-6 divide-y divide-cream-dark rounded bg-white/70">
        {list.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-3 p-4">
            <div>
              <Link href={`/admin/artikel/${p.id}`} className="font-medium hover:text-gold-dark">{p.title}</Link>
              <span className="ml-2 rounded bg-cream-dark px-2 py-0.5 text-xs">{p.status}</span>
            </div>
            {(me.role === "admin" || p.authorId === me.id) && (
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

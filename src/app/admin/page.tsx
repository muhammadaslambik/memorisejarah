import Link from "next/link";
import { desc } from "drizzle-orm";
import { db, posts } from "@/db";
import { deletePost, logout } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const list = await db().select().from(posts).orderBy(desc(posts.updatedAt));
  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl">Artikel</h1>
        <div className="flex gap-3">
          <Link href="/admin/artikel/baru" className="rounded bg-gold px-4 py-2 text-white">+ Artikel Baru</Link>
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
            <form action={deletePost}>
              <input type="hidden" name="id" value={p.id} />
              <button className="text-sm text-red-700">Hapus</button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}

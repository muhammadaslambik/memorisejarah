// PAKET-9C: susunan redaksi dari database; setiap nama menuju halaman profil
import Link from "next/link";
import { eq } from "drizzle-orm";
import { fotoRedaksiSql } from "@/lib/foto-redaksi";
import { db, redaksi, redaksiTim, users } from "@/db";
import { TIM } from "@/lib/redaksi";
import { Avatar } from "@/components/content/Avatar";

export const dynamic = "force-dynamic";
export const metadata = { title: "Susunan Redaksi" };

export default async function Redaksi() {
  let anggota: { id: number; slug: string; name: string; peran: string; pemimpin: boolean; fotoUrl: string | null }[] = [];
  let relasi: { memberId: number; tim: string; catatan: string }[] = [];
  try {
    [anggota, relasi] = await Promise.all([
      db().select({ id: redaksi.id, slug: redaksi.slug, name: redaksi.name, peran: redaksi.peran, pemimpin: redaksi.pemimpin, fotoUrl: fotoRedaksiSql })
        .from(redaksi).leftJoin(users, eq(users.id, redaksi.userId)).where(eq(redaksi.aktif, true)).orderBy(redaksi.urutan, redaksi.name),
      db().select().from(redaksiTim),
    ]);
  } catch { /* tabel belum dibuat: tampilkan halaman kosong */ }

  const pemimpin = anggota.filter((a) => a.pemimpin);
  const sudahDiTim = new Set(relasi.map((r) => r.memberId));
  const lain = anggota.filter((a) => !a.pemimpin && !sudahDiTim.has(a.id));
  const nama = (a: { slug: string; name: string }) => (
    <Link href={`/${a.slug}`} className="underline-offset-4 hover:text-ms-gold hover:underline">{a.name}</Link>
  );

  return (
    <div className="-mb-16 min-h-[70vh] bg-ms-bg pb-24 text-ms-cream">
      <section className="mx-auto max-w-[90rem] px-6 pt-12 md:px-10 lg:px-16">
        <h1 className="font-serif text-2xl sm:text-4xl font-bold md:text-5xl">Susunan Redaksi</h1>
        <p className="mt-3 text-ms-cream/70">Klik nama untuk melihat profil anggota.</p>
        {anggota.length === 0 && <p className="mt-8 text-ms-cream/60">Susunan redaksi belum diatur.</p>}

        {pemimpin.map((a) => (
          <div key={a.id} className="mt-8 flex items-center gap-5 rounded-2xl border border-ms-gold/40 bg-ms-surface p-6 md:p-8">
            <Avatar nama={a.name} url={a.fotoUrl} ukuran={72} />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ms-gold">{a.peran || "Pendiri & Pemimpin Redaksi"}</p>
              <p className="mt-2 font-serif text-xl sm:text-2xl font-bold">{nama(a)}</p>
            </div>
          </div>
        ))}

        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {TIM.map((t) => {
            const isi = relasi.filter((r) => r.tim === t.kunci)
              .map((r) => ({ r, a: anggota.find((x) => x.id === r.memberId) }))
              .filter((x): x is { r: (typeof relasi)[number]; a: (typeof anggota)[number] } => !!x.a);
            if (isi.length === 0) return null;
            return (
              <div key={t.kunci} className="rounded-2xl border border-ms-line bg-ms-surface p-6">
                <h2 className="font-serif text-xl font-bold text-ms-gold">{t.nama}</h2>
                <ul className="mt-4 space-y-2 text-ms-cream/80">
                  {isi.map(({ r, a }) => (
                    <li key={a.id}>{nama(a)}{r.catatan && <span className="text-ms-cream/50"> ({r.catatan})</span>}</li>
                  ))}
                </ul>
              </div>
            );
          })}
          {lain.length > 0 && (
            <div className="rounded-2xl border border-ms-line bg-ms-surface p-6">
              <h2 className="font-serif text-xl font-bold text-ms-gold">Anggota Lainnya</h2>
              <ul className="mt-4 space-y-2 text-ms-cream/80">{lain.map((a) => <li key={a.id}>{nama(a)}</li>)}</ul>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
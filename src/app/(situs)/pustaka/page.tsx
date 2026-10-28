// PAKET-2A
import Link from "next/link";
import { PUSTAKA } from "@/lib/pustaka";

export const metadata = { title: "Pustaka" };

const kartu = "group flex flex-col rounded-2xl border border-ms-line bg-ms-surface p-6 transition hover:-translate-y-1 hover:border-ms-gold/50";

export default function Pustaka() {
  return (
    <div className="-mb-16 min-h-[70vh] bg-ms-bg pb-24 text-ms-cream">
      <section className="mx-auto max-w-[90rem] px-6 md:px-10 lg:px-16 pt-12">
        <h1 className="font-serif text-4xl font-bold md:text-5xl">Pustaka</h1>
        <p className="mt-3 max-w-2xl text-ms-cream/70">
          Karya sejarah memerlukan referensi yang akurat dan dapat dipertanggungjawabkan. Berikut koleksi sumber yang kami kumpulkan.
        </p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PUSTAKA.map((p) => (
            <a key={p.nama} href={p.url} target="_blank" rel="noopener noreferrer" className={kartu}>
              <h2 className="font-serif text-xl font-bold group-hover:text-ms-gold">{p.nama}</h2>
              <p className="mt-2 flex-1 text-sm text-ms-cream/65">{p.ket}</p>
              <span className="mt-5 text-sm text-ms-gold">Buka di Google Drive &rarr;</span>
            </a>
          ))}
          <Link href="/gambar" className={kartu}>
            <h2 className="font-serif text-xl font-bold group-hover:text-ms-gold">Galeri Gambar</h2>
            <p className="mt-2 flex-1 text-sm text-ms-cream/65">Foto, lukisan, dan arsip visual yang tayang di situs ini.</p>
            <span className="mt-5 text-sm text-ms-gold">Lihat galeri &rarr;</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
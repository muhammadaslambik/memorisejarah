// PAKET-3C2
import Link from "next/link";
import { getPustaka } from "@/lib/pengaturan";
import { PustakaViewer } from "@/components/content/PustakaViewer";

export const metadata = { title: "Pustaka" };

export default async function Pustaka({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const { f } = await searchParams;
  const pustaka = await getPustaka();
  return (
    <div className="-mb-16 min-h-[70vh] bg-ms-bg pb-24 text-ms-cream">
      <section className="mx-auto max-w-[90rem] px-6 pt-12 md:px-10 lg:px-16">
        <h1 className="font-serif text-4xl font-bold md:text-5xl">Pustaka</h1>
        <p className="mt-3 max-w-2xl text-ms-cream/70">
          Karya sejarah memerlukan referensi yang akurat dan dapat dipertanggungjawabkan. Berikut koleksi sumber yang kami kumpulkan.
        </p>
        <div className="mt-8"><PustakaViewer folders={pustaka} awal={f ?? ""} /></div>
        <p className="mt-10 text-sm text-ms-cream/70">
          Mencari foto dan lukisan yang tayang di situs ini? <Link href="/gambar" className="text-ms-gold">Buka Galeri Gambar &rarr;</Link>
        </p>
      </section>
    </div>
  );
}
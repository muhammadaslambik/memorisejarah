// PAKET-2B
import { InformasiBlok } from "@/components/home/InformasiBlok";
import { InformasiTerbaru } from "@/components/home/InformasiTerbaru";
import { AgendaKartu } from "@/components/home/AgendaKartu";
import { SectionTitle } from "@/components/home/SectionTitle";

// Isi Informasi Pilihan dan Informasi Terbaru berasal dari database: dirender saat diminta, bukan saat build (di Cloudflare tidak ada DATABASE_URL saat build).
export const dynamic = "force-dynamic";
export const metadata = { title: "Informasi" };

export default function Informasi() {
  return (
    <div className="-mb-16 min-h-[70vh] bg-ms-bg pb-24 text-ms-cream">
      <section className="hp-mepet mx-auto max-w-[90rem] px-1 pt-12 sm:px-6 md:px-10 lg:px-16">
        <h1 className="font-serif text-2xl sm:text-4xl font-bold md:text-5xl">Informasi</h1>
        <p className="mt-3 max-w-2xl text-ms-cream/70">Kumpulan informasi terkait kegiatan Memori Sejarah.</p>
        <div className="mt-10"><SectionTitle>Informasi Pilihan</SectionTitle></div>
        <InformasiBlok />
        <div className="mt-14"><SectionTitle>Informasi Terbaru</SectionTitle></div>
        <InformasiTerbaru mode="grid" />
        <div className="mt-14"><SectionTitle>Program Kegiatan</SectionTitle></div>
        <AgendaKartu />
      </section>
    </div>
  );
}
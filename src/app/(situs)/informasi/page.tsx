// PAKET-2B
import { InformasiBlok } from "@/components/home/InformasiBlok";
import { AgendaKartu } from "@/components/home/AgendaKartu";
import { SectionTitle } from "@/components/home/SectionTitle";

export const metadata = { title: "Informasi" };

export default function Informasi() {
  return (
    <div className="-mb-16 min-h-[70vh] bg-ms-bg pb-24 text-ms-cream">
      <section className="mx-auto max-w-[90rem] px-6 pt-12 md:px-10 lg:px-16">
        <h1 className="font-serif text-4xl font-bold md:text-5xl">Informasi</h1>
        <p className="mt-3 max-w-2xl text-ms-cream/70">Kumpulan informasi terkait kegiatan Memori Sejarah.</p>
        <div className="mt-10"><SectionTitle>Informasi Terbaru</SectionTitle></div>
        <InformasiBlok />
        <div className="mt-14"><SectionTitle>Program Kegiatan</SectionTitle></div>
        <AgendaKartu />
      </section>
    </div>
  );
}
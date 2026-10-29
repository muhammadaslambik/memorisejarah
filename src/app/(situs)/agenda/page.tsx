// PAKET-2C
import { AgendaKartu } from "@/components/home/AgendaKartu";

export const metadata = { title: "Agenda Kegiatan" };

export default function Agenda() {
  return (
    <div className="-mb-16 min-h-[70vh] bg-ms-bg pb-24 text-ms-cream">
      <section className="mx-auto max-w-[90rem] px-6 pt-12 md:px-10 lg:px-16">
        <h1 className="font-serif text-4xl font-bold md:text-5xl">Agenda Kegiatan</h1>
        <p className="mt-3 max-w-2xl text-ms-cream/70">Program diskusi, podcast, penelitian lapangan, dan film dokumenter dari Memori Sejarah.</p>
        <AgendaKartu />
      </section>
    </div>
  );
}
// PAKET-3C2
import Link from "next/link";
import { getAgenda } from "@/lib/pengaturan";

export async function AgendaKartu() {
  const agenda = await getAgenda();
  return (
    <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {agenda.map((a) => (
        <Link
          key={a.slug} href={`/agenda/${a.slug}`}
          className={`group flex min-h-44 flex-col rounded-2xl border bg-gradient-to-br p-5 transition hover:-translate-y-1 ${a.kelas}`}
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-black/30 text-xl">{a.emoji}</span>
          <h3 className="mt-5 font-serif text-lg font-bold leading-snug">{a.nama}</h3>
          <p className="mt-1 flex-1 text-[11px] font-semibold uppercase tracking-wider text-ms-cream/55">{a.sub}</p>
          <span className="mt-4 text-sm text-ms-gold">Lihat Agenda &rarr;</span>
        </Link>
      ))}
    </div>
  );
}
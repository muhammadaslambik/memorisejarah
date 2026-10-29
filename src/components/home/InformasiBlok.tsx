// PAKET-3C2: isi dari CMS (menu Informasi); bila kosong memakai teks bawaan
import Link from "next/link";
import { getInformasi } from "@/lib/pengaturan";

const tebal = (s: string) => s.split("**").map((p, i) => (i % 2 ? <strong key={i}>{p}</strong> : p));

export async function InformasiBlok() {
  const d = await getInformasi();
  return (
    <div className="mt-6 space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-800 to-red-950 p-8">
          <span className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider">{d.merah.label}</span>
          <h3 className="mt-5 max-w-sm font-serif text-3xl font-bold leading-tight">{d.merah.judul}</h3>
          <p className="mt-3 text-amber-400">&#9733; &#9733; &#9733;</p>
          <div className="mt-5 flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-ms-cream text-2xl">&#9994;</span>
            <p className="max-w-xs text-sm text-white/85">{d.merah.ket}</p>
          </div>
          <Link href={d.merah.href} className="mt-6 inline-flex rounded-full bg-ms-cream px-5 py-2.5 text-sm font-semibold text-ms-bg">{d.merah.tombol}</Link>
        </div>
        <div className="rounded-3xl bg-ms-cream p-8 text-ms-bg">
          <div className="flex items-start gap-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-ms-bg text-3xl">&#128220;</span>
            <div>
              <h3 className="font-serif text-2xl font-bold uppercase">{d.krem.judul}</h3>
              <p className="mt-2 text-sm text-ms-bg/75">{tebal(d.krem.isi)}</p>
            </div>
          </div>
          <p className="mt-6 rounded-xl bg-ms-bg/10 px-4 py-3 text-xs italic text-ms-bg/70">{d.krem.kutipan}</p>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-5 rounded-3xl border border-ms-line bg-ms-surface p-5 sm:flex-row">
          <div className="flex min-h-40 shrink-0 flex-col justify-between rounded-2xl border border-emerald-800/50 bg-gradient-to-br from-emerald-900 to-emerald-950 p-4 sm:w-44">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">{d.diskusi.thumbAtas}</span>
            <span className="font-serif text-sm font-bold">{d.diskusi.thumbJudul}</span>
            <span className="text-xs text-emerald-300">{d.diskusi.thumbBawah}</span>
          </div>
          <div>
            <span className="rounded-full border border-emerald-700 bg-emerald-950 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-300">{d.diskusi.badge}</span>
            <h3 className="mt-3 font-serif text-xl font-bold leading-snug">{d.diskusi.judul}</h3>
            <p className="mt-2 text-sm text-ms-cream/70">{d.diskusi.deskripsi}</p>
            <p className="mt-3 text-xs text-ms-cream/55">{d.diskusi.info}</p>
          </div>
        </div>
        <div className="flex flex-col rounded-3xl border border-emerald-800/50 bg-gradient-to-br from-emerald-950 to-ms-surface p-6">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-900/60 text-xl">&#127769;</span>
          <h3 className="mt-5 font-serif text-xl font-bold leading-snug">{d.hijau.judul}</h3>
          <p className="mt-2 flex-1 text-sm text-emerald-200/70">{d.hijau.deskripsi}</p>
          <Link href={d.hijau.href} className="mt-6 inline-flex self-start rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-emerald-950">{d.hijau.tombol} &rarr;</Link>
        </div>
      </div>
    </div>
  );
}
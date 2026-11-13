// PAKET-19/21: tampilan Informasi Pilihan yang DIPAKAI BERSAMA oleh situs dan editor CMS, sehingga yang diedit di CMS sama persis dengan yang tampil di situs.
// "isi" menggambar teks (situs: teks biasa; CMS: kolom isian yang dirias sama). "tombol" menggambar tombol bertautan.
// "tata" mengatur urutan, lebar, tinggi, bentuk, latar, warna/jenis/ukuran teks tiap blok; "bungkus" membungkus tiap blok (situs: animasi; CMS: pegangan geser/ubah ukuran).
import type { CSSProperties, ReactNode } from "react";
import type { Informasi } from "@/lib/pengaturan";
import { RADIUS, cssLatar, type BlokId, type TataInformasi } from "@/lib/informasi-tata";

export type Isi = (g: keyof Informasi, k: string, o?: { tebal?: boolean }) => ReactNode;
export type Tombol = (g: "merah" | "hijau", kelas: string, akhiran?: ReactNode) => ReactNode;
export type Bungkus = (id: BlokId, node: ReactNode) => ReactNode;

export function InformasiTampilan({ isi, tombol, tata, bungkus, editor, gridRef }: { isi: Isi; tombol: Tombol; tata: TataInformasi; bungkus: Bungkus; editor?: boolean; gridRef?: React.Ref<HTMLDivElement> }) {
  const kartu = (id: BlokId, kelas: string, anak: ReactNode) => {
    const g = tata.gaya[id];
    const st: CSSProperties & Record<string, string | number | undefined> = {
      borderRadius: RADIUS[g.bentuk],
      minHeight: g.tinggi ? g.tinggi : undefined,
      zoom: g.skala !== 100 ? g.skala / 100 : undefined,
    };
    if (g.latar) st.background = cssLatar(g.latar);
    if (g.teks) { st.color = g.teks; st["--ms-teks"] = g.teks; }
    return <div className={`${kelas} h-full ${g.teks ? "ms-teks-paksa" : ""} ${g.font !== "bawaan" ? `ms-font-${g.font}` : ""}`} style={st}>{anak}</div>;
  };

  const blok: Record<BlokId, ReactNode> = {
    merah: kartu("merah", "relative overflow-hidden bg-gradient-to-br from-red-800 to-red-950 p-8 text-white", (
      <>
        <span className="inline-block rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider">{isi("merah", "label")}</span>
        <h3 className="mt-5 max-w-sm font-serif text-2xl font-bold leading-tight sm:text-3xl">{isi("merah", "judul")}</h3>
        <p className="mt-3 text-amber-400">&#9733; &#9733; &#9733;</p>
        <div className="mt-5 flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-ms-cream text-xl text-ms-bg sm:text-2xl">&#9994;</span>
          <p className="max-w-xs text-sm text-white/85">{isi("merah", "ket")}</p>
        </div>
        {tombol("merah", "mt-6 inline-flex rounded-full bg-ms-cream px-5 py-2.5 text-sm font-semibold text-ms-bg")}
      </>
    )),
    krem: kartu("krem", "bg-ms-cream p-8 text-ms-bg", (
      <>
        <div className="flex items-start gap-4">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-ms-bg text-2xl text-ms-cream sm:text-3xl">&#128220;</span>
          <div className="min-w-0 flex-1">
            <h3 className="font-serif text-xl font-bold uppercase sm:text-2xl">{isi("krem", "judul")}</h3>
            <p className="mt-2 text-sm text-ms-bg/75">{isi("krem", "isi", { tebal: true })}</p>
          </div>
        </div>
        <p className="mt-6 rounded-xl bg-ms-bg/10 px-4 py-3 text-xs italic text-ms-bg/70">{isi("krem", "kutipan")}</p>
      </>
    )),
    diskusi: kartu("diskusi", "flex flex-col gap-0 overflow-hidden border border-ms-line bg-ms-surface p-0 text-ms-cream sm:flex-row sm:gap-5 sm:overflow-visible sm:p-5", (
      <>
        <div className="flex min-h-40 shrink-0 flex-col justify-between border border-emerald-800/50 bg-gradient-to-br from-emerald-900 to-emerald-950 p-4 max-sm:border-x-0 max-sm:border-t-0 sm:w-44 sm:rounded-xl">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">{isi("diskusi", "thumbAtas")}</span>
          <span className="font-serif text-sm font-bold">{isi("diskusi", "thumbJudul")}</span>
          <span className="text-xs text-emerald-300">{isi("diskusi", "thumbBawah")}</span>
        </div>
        <div className="min-w-0 flex-1 max-sm:p-5">
          <span className="inline-block rounded-full border border-emerald-700 bg-emerald-950 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-300">{isi("diskusi", "badge")}</span>
          <h3 className="mt-3 font-serif text-xl font-bold leading-snug">{isi("diskusi", "judul")}</h3>
          <p className="mt-2 text-sm text-ms-cream/70">{isi("diskusi", "deskripsi")}</p>
          <p className="mt-3 text-xs text-ms-cream/55">{isi("diskusi", "info")}</p>
        </div>
      </>
    )),
    hijau: kartu("hijau", "flex flex-col border border-emerald-800/50 bg-gradient-to-br from-emerald-950 to-ms-surface p-6 text-ms-cream", (
      <>
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-900/60 text-xl">&#127769;</span>
        <h3 className="mt-5 font-serif text-xl font-bold leading-snug">{isi("hijau", "judul")}</h3>
        <p className="mt-2 flex-1 text-sm text-emerald-200/70">{isi("hijau", "deskripsi")}</p>
        {tombol("hijau", "mt-6 inline-flex self-start rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-emerald-950", <>&nbsp;&rarr;</>)}
      </>
    )),
  };

  return (
    <div className="ms-grid" ref={gridRef}>
      {tata.urutan.filter((id) => editor || !tata.gaya[id].sembunyi).map((id) => bungkus(id, blok[id]))}
    </div>
  );
}

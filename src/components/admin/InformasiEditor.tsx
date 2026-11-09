// PAKET-19: editor Informasi Pilihan bergaya "pengaturan halaman" WordPress: kanvas = tampilan situs yang SAMA PERSIS (komponen InformasiTampilan),
// dengan teks yang langsung bisa diketik di tempatnya; panel samping berisi tombol Simpan dan petunjuk.
"use client";
import Link from "next/link";
import type { Informasi } from "@/lib/pengaturan";
import { InformasiTampilan, type Isi, type Tombol } from "@/components/home/InformasiTampilan";

const kolom = "block w-full resize-none rounded bg-transparent px-1 -mx-1 [color:inherit] [font:inherit] [letter-spacing:inherit] [text-transform:inherit] [field-sizing:content] outline-none ring-1 ring-transparent transition placeholder:opacity-40 hover:ring-white/30 focus:ring-amber-400/80";

export function InformasiEditor({ d, aksi }: { d: Informasi; aksi: (fd: FormData) => void | Promise<void> }) {
  const nilai = (g: keyof Informasi, k: string) => (d[g] as unknown as Record<string, string>)[k] ?? "";
  const isi: Isi = (g, k, o) => (
    <textarea
      name={`${g}__${k}`}
      defaultValue={nilai(g, k)}
      rows={1}
      maxLength={800}
      spellCheck={false}
      aria-label={`${g} ${k}`}
      title={o?.tebal ? "Gunakan **tebal** untuk huruf tebal" : undefined}
      className={kolom}
    />
  );
  const tombol: Tombol = (g, kelas, akhiran) => (
    <div className="mt-6">
      <span className={`${kelas} !mt-0`}>
        <input name={`${g}__tombol`} defaultValue={nilai(g, "tombol")} maxLength={800} aria-label={`${g} teks tombol`} className="w-32 bg-transparent text-center outline-none [color:inherit] [font:inherit]" />
        {akhiran}
      </span>
      <label className="mt-2 block text-[11px] opacity-70">
        Tautan tombol
        <input name={`${g}__href`} defaultValue={nilai(g, "href")} maxLength={800} placeholder="/artikel/slug atau https://..." className="mt-0.5 block w-full rounded border border-white/20 bg-black/20 px-2 py-1 text-xs [color:inherit] outline-none focus:border-amber-400/80" />
      </label>
    </div>
  );
  return (
    <form action={aksi} className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
      <div className="rounded-2xl bg-ms-bg p-4 text-ms-cream sm:p-6">
        <p className="mb-4 text-xs text-ms-cream/60">Ketik langsung pada kartu di bawah. Tampilannya sama dengan Beranda dan halaman Informasi. Kolom yang dikosongkan kembali ke teks bawaan.</p>
        <InformasiTampilan isi={isi} tombol={tombol} />
      </div>
      <aside className="a-card space-y-3 p-4 lg:sticky lg:top-24">
        <h2 className="text-sm font-semibold">Informasi Pilihan</h2>
        <button className="a-btn w-full justify-center">Simpan perubahan</button>
        <Link href="/informasi" target="_blank" className="a-btn-soft w-full justify-center text-sm">Lihat di situs &#8599;</Link>
        <p className="a-muted text-xs">Perubahan langsung tampil di Beranda dan halaman Informasi. Untuk huruf tebal pada isi kartu krem, apit kata dengan dua tanda bintang: **seperti ini**.</p>
      </aside>
    </form>
  );
}

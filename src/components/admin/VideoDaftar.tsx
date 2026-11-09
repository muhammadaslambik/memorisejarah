// PAKET-15B: daftar video di CMS dengan tampilan Baris atau Kolom (pilihan diingat) dan tombol Lihat (pemutar tersemat).
"use client";
import { useEffect, useState } from "react";
import { IkonEdit, IkonHapus } from "@/components/admin/TombolAksi";
import { PemutarTerpadu, type ModePemutar } from "@/components/admin/PemutarTerpadu";
import { MenuIkon } from "@/components/admin/MenuIkon";
import { PILIHAN } from "@/lib/pilihan-halaman";
import { BarDaftar, Pager, useHalaman, potong, cocokKat, type Kat } from "@/components/admin/KontrolDaftar";

export type ItemVideo = { id: number; title: string; status: string; featured: boolean; youtubeId: string; categoryId: number | null };
type Mode = "baris" | "kolom";
type Saring = "semua" | "terbit" | "pilihan";
const KUNCI = "adm-video-tampil";
const gi = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const g = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export function VideoDaftar({ items, hapus, cats }: { items: ItemVideo[]; hapus: (fd: FormData) => void | Promise<void>; cats: Kat[] }) {
  const [mode, setMode] = useState<Mode>("kolom");
  const [aktif, setAktif] = useState<{ x: ItemVideo; mode: ModePemutar } | null>(null); // satu pemutar: bentuknya berganti tanpa memuat ulang video
  const putar = (x: ItemVideo, mode: ModePemutar) => setAktif({ x, mode });
  const sedangInline = (x: ItemVideo) => aktif?.x.id === x.id && aktif.mode === "inline";
  const [saring, setSaring] = useState<Saring>("semua");
  const nTerbit = items.filter((x) => x.status === "published").length;
  const nPilihan = items.filter((x) => x.featured).length;
  const [kat, setKat] = useState("semua");
  const { per, setPer, hal, setHal } = useHalaman("adm-per-video");
  const terfilter = items.filter((x) => (saring === "terbit" ? x.status === "published" : saring === "pilihan" ? x.featured : true) && cocokKat(kat, x.categoryId));
  const { baris: tampil, jumlah: jumlahHal, hal: halIni } = potong(terfilter, hal, per);
  const ubahSaring = (v: Saring) => { setSaring(v); setHal(1); };
  const judulDaftar = saring === "terbit" ? "Video terbit" : saring === "pilihan" ? "Video pilihan" : "Semua video";

  useEffect(() => {
    try { if (localStorage.getItem(KUNCI) === "baris") setMode("baris"); } catch { /* abaikan */ }
  }, []);
  const pilih = (m: Mode) => { setMode(m); try { localStorage.setItem(KUNCI, m); } catch { /* abaikan */ } };

  const chip = (x: ItemVideo) => (
    <>
      <span className={`a-chip ${x.status === "published" ? "a-chip-hijau" : "a-chip-abu"}`}>{x.status === "published" ? "terbit" : "draft"}</span>
      {x.featured && <span className="a-chip a-chip-kuning">pilihan</span>}
    </>
  );
  const tombolLihat = (x: ItemVideo) => (
    <button type="button" onClick={() => putar(x, "modal")} className="a-btn-soft !px-3 !py-1 text-sm" aria-label={`Lihat video: ${x.title}`}>
      <svg {...g} className="h-4 w-4"><path d="M8 5v14l11-7z" /></svg>Lihat
    </button>
  );
  const ikonEdit = (x: ItemVideo) => <IkonEdit href={`/admin/video?edit=${x.id}`} label="Edit video" />;
  const formHapus = (x: ItemVideo) => (
    <form action={hapus}>
      <input type="hidden" name="id" value={x.id} />
      <IkonHapus label="Hapus video" pesan={`Hapus video "${x.title}"? Tindakan ini tidak bisa dibatalkan.`} />
    </form>
  );

  return (
    <div>
      <BarDaftar
        judul={<h2 className="font-medium">{judulDaftar} ({terfilter.length})</h2>}
        menu={<>
          <MenuIkon
            judul="Saring video"
            ikon={<svg {...gi} className="h-5 w-5"><path d="M3 5h18l-7 8v6l-4-2v-4z" /></svg>}
            label={judulDaftar}
            opsi={[
              { label: "Semua", aktif: saring === "semua", n: items.length, klik: () => ubahSaring("semua") },
              { label: "Video terbit", aktif: saring === "terbit", n: nTerbit, klik: () => ubahSaring("terbit") },
              { label: "Video pilihan", aktif: saring === "pilihan", n: nPilihan, klik: () => ubahSaring("pilihan") },
            ]}
          />
          <MenuIkon
            judul="Tampilan daftar"
            ikon={<svg {...gi} className="h-5 w-5"><rect x="4" y="4" width="7" height="7" rx="1" /><rect x="13" y="4" width="7" height="7" rx="1" /><rect x="4" y="13" width="7" height="7" rx="1" /><rect x="13" y="13" width="7" height="7" rx="1" /></svg>}
            label={mode === "baris" ? "Baris" : "Kolom"}
            opsi={[
              { label: "Baris", aktif: mode === "baris", ikon: <svg {...gi} className="h-4 w-4"><path d="M4 6h16M4 12h16M4 18h16" /></svg>, klik: () => pilih("baris") },
              { label: "Kolom", aktif: mode === "kolom", ikon: <svg {...gi} className="h-4 w-4"><rect x="4" y="4" width="7" height="7" rx="1" /><rect x="13" y="4" width="7" height="7" rx="1" /><rect x="4" y="13" width="7" height="7" rx="1" /><rect x="13" y="13" width="7" height="7" rx="1" /></svg>, klik: () => pilih("kolom") },
            ]}
          />
          <MenuIkon
            judul="Saring kategori"
            ikon={<svg {...gi} className="h-5 w-5"><path d="M3 12V4h8l10 10-8 8z" /><circle cx="7.5" cy="8.5" r="1" fill="currentColor" /></svg>}
            label={kat === "semua" ? "Semua kategori" : kat === "0" ? "Tanpa kategori" : (cats.find((c) => String(c.id) === kat)?.name ?? "Kategori")}
            opsi={[
              { label: "Semua kategori", aktif: kat === "semua", klik: () => { setKat("semua"); setHal(1); } },
              ...cats.map((c) => ({ label: c.name, aktif: kat === String(c.id), klik: () => { setKat(String(c.id)); setHal(1); } })),
              { label: "(tanpa kategori)", aktif: kat === "0", klik: () => { setKat("0"); setHal(1); } },
            ]}
            kanan
          />
          <MenuIkon
            judul="Jumlah per halaman"
            ikon={<svg {...gi} className="h-5 w-5"><path d="M4 6h16M4 12h16M4 18h10" /></svg>}
            label={per === 0 ? "Semua" : `${per} / hal.`}
            opsi={PILIHAN.map((n) => ({ label: n === 0 ? "Semua" : `${n} per halaman`, aktif: per === n, klik: () => setPer(n) }))}
            kanan
          />
        </>}
      />

      {tampil.length === 0 ? (
        <p className="a-muted mt-2 text-sm">{items.length === 0 ? "Belum ada video." : "Tidak ada video pada pilihan ini."}</p>
      ) : mode === "baris" ? (
        <ul className="a-card a-daftar mt-3">
          {tampil.map((x) => (
            <li key={x.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0 flex-1">
                <button type="button" onClick={() => putar(x, "modal")} className="text-left font-medium hover:text-[color:var(--a-accent)]" title="Putar video">{x.title}</button>
                <span className="ml-2 inline-flex gap-1.5 align-middle">{chip(x)}</span>
              </div>
              <div className="flex items-center gap-1.5">{tombolLihat(x)}{ikonEdit(x)}{formHapus(x)}</div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {tampil.map((x) => (
            <div key={x.id} className="a-card flex flex-col">
              <div id={`slot-video-${x.id}`} className="relative aspect-video w-full overflow-hidden rounded-t-[inherit] bg-black">
                <button type="button" onClick={() => putar(x, "inline")} className="group absolute inset-0 block" aria-label={`Putar video: ${x.title}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`https://i.ytimg.com/vi/${x.youtubeId}/mqdefault.jpg`} alt="" loading="lazy" className="h-full w-full object-cover opacity-90 transition group-hover:opacity-100" />
                  <span className="absolute inset-0 grid place-items-center">
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-black/60 text-white transition group-hover:scale-110"><svg {...g} className="h-6 w-6" fill="currentColor"><path d="M8 5v14l11-7z" /></svg></span>
                  </span>
                </button>
              </div>
              <div className="flex flex-1 flex-col gap-2 p-3">
                <button type="button" onClick={() => putar(x, "inline")} className="line-clamp-3 text-left text-sm font-medium hover:text-[color:var(--a-accent)]" title="Putar video">{x.title}</button>
                <div className="flex flex-wrap items-center gap-1.5">{chip(x)}</div>
                <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                  <button type="button" onClick={() => (sedangInline(x) ? setAktif(null) : putar(x, "inline"))} className="a-btn-soft !px-3 !py-1 text-sm" aria-label={sedangInline(x) ? `Hentikan video: ${x.title}` : `Putar video: ${x.title}`}>
                    {sedangInline(x)
                      ? <><svg {...g} className="h-4 w-4"><rect x="6" y="6" width="12" height="12" rx="1.5" fill="currentColor" /></svg>Berhenti</>
                      : <><svg {...g} className="h-4 w-4"><path d="M8 5v14l11-7z" /></svg>Putar</>}
                  </button>
                  <button type="button" onClick={() => putar(x, "modal")} className="a-ikon-btn !h-8 !w-8" aria-label={`Perbesar: ${x.title}`} title="Perbesar">
                    <svg {...g} className="h-4 w-4"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
                  </button>
                  <button type="button" onClick={() => putar(x, "mini")} className="a-ikon-btn !h-8 !w-8" aria-label={`Mini player: ${x.title}`} title="Mini player">
                    <svg {...g} className="h-4 w-4"><rect x="3" y="5" width="18" height="14" rx="2" /><rect x="12" y="11" width="7" height="5" rx="1" fill="currentColor" /></svg>
                  </button>
                  <span className="ml-auto flex items-center gap-1">{ikonEdit(x)}{formHapus(x)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pager hal={halIni} jumlah={jumlahHal} ubah={setHal} />

      {aktif && (
        <PemutarTerpadu
          key={aktif.x.id}
          judul={aktif.x.title}
          youtubeId={aktif.x.youtubeId}
          mode={aktif.mode}
          ubahMode={(m) => setAktif({ x: aktif.x, mode: m })}
          slotId={`slot-video-${aktif.x.id}`}
          onTutup={() => setAktif(null)}
        />
      )}
    </div>
  );
}

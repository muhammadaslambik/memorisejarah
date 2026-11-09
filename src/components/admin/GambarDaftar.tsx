// PAKET-15I: daftar gambar di CMS: tampilan Kolom (bawaan) atau Baris, saring status dan kategori, jumlah per halaman, dan pratinjau yang bisa diperbesar.
"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { IkonEdit, IkonHapus } from "@/components/admin/TombolAksi";
import { BarDaftar, PilihKategori, PilihJumlah, Pager, useHalaman, potong, cocokKat, type Kat } from "@/components/admin/KontrolDaftar";
import { kecil } from "@/lib/gambar-url";

export type ItemGambar = { id: number; title: string; status: string; url: string; categoryId: number | null };
type Mode = "baris" | "kolom";
type Saring = "semua" | "terbit" | "draft";
const KUNCI = "adm-gambar-tampil";
const g = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;

type UkuranGbr = "muat" | "asli" | "penuh";
const NAMA_G: Record<UkuranGbr, string> = { muat: "Muat di layar", asli: "Ukuran asli", penuh: "Layar penuh" };
const BERIKUT_G: Record<UkuranGbr, UkuranGbr> = { muat: "asli", asli: "penuh", penuh: "muat" };

function Pratinjau({ x, onTutup }: { x: ItemGambar; onTutup: () => void }) {
  const [ukuran, setUkuran] = useState<UkuranGbr>("muat");
  const panel = useRef<HTMLDivElement>(null);
  const penuh = ukuran === "penuh";

  const keluarPenuh = useCallback(async () => {
    if (document.fullscreenElement) { try { await document.exitFullscreen(); } catch { /* abaikan */ } }
    setUkuran("muat");
  }, []);
  useEffect(() => {
    if (ukuran === "penuh" && !document.fullscreenElement) panel.current?.requestFullscreen?.().catch(() => { /* tetap mode CSS */ });
  }, [ukuran]);
  useEffect(() => {
    const ubah = () => { if (!document.fullscreenElement) setUkuran((u) => (u === "penuh" ? "muat" : u)); };
    document.addEventListener("fullscreenchange", ubah);
    return () => { document.removeEventListener("fullscreenchange", ubah); if (document.fullscreenElement) document.exitFullscreen().catch(() => { /* abaikan */ }); };
  }, []);
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key !== "Escape") return; if (penuh) void keluarPenuh(); else onTutup(); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [penuh, keluarPenuh, onTutup]);

  const ganti = () => { const ke = BERIKUT_G[ukuran]; if (ukuran === "penuh") void keluarPenuh(); else setUkuran(ke); };
  const tuju = BERIKUT_G[ukuran];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-3 sm:p-6" onMouseDown={(e) => { if (e.target === e.currentTarget) onTutup(); }} role="dialog" aria-modal="true" aria-label={`Pratinjau gambar: ${x.title}`}>
      <div ref={panel} className={`a-card flex w-full flex-col overflow-hidden shadow-2xl ${penuh ? "!fixed inset-0 z-[80] !max-w-none !rounded-none" : "max-h-full max-w-5xl"}`}>
        <div className="flex shrink-0 items-center gap-2 px-4 py-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-memori-sejarah-kecil.png" alt="" width={28} height={28} className="h-7 w-7 shrink-0 rounded-full" />
          <p className="min-w-0 flex-1 truncate text-sm font-semibold">{x.title}</p>
          <button type="button" onClick={ganti} className="a-btn-soft !px-2.5 !py-1.5 text-xs" aria-label={`Ubah ke ${NAMA_G[tuju].toLowerCase()}`} title={`Sekarang: ${NAMA_G[ukuran]}. Klik untuk ${NAMA_G[tuju].toLowerCase()}`}>
            {tuju === "asli" && <svg {...g} className="h-4 w-4"><path d="M3 8V3h5M21 8V3h-5M3 16v5h5M21 16v5h-5" /></svg>}
            {tuju === "penuh" && <svg {...g} className="h-4 w-4"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>}
            {tuju === "muat" && <svg {...g} className="h-4 w-4"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" /></svg>}
            <span>{NAMA_G[tuju]}</span>
          </button>
          <button type="button" onClick={onTutup} className="a-ikon-btn !h-9 !w-9 !bg-black/20 hover:!bg-black/30" aria-label="Tutup" title="Tutup">
            <svg {...g} className="h-[18px] w-[18px]"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        <div className={`min-h-0 flex-1 bg-black/80 ${ukuran === "asli" ? "overflow-auto" : "flex items-center justify-center overflow-hidden"}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ukuran === "asli" ? x.url : kecil(x.url, penuh ? 2400 : 1600)} alt={x.title} referrerPolicy="no-referrer" className={ukuran === "asli" ? "mx-auto max-w-none" : penuh ? "h-full w-full object-contain" : "max-h-[75vh] w-auto max-w-full object-contain"} />
        </div>
      </div>
    </div>
  );
}

export function GambarDaftar({ items, hapus, cats }: { items: ItemGambar[]; hapus: (fd: FormData) => void | Promise<void>; cats: Kat[] }) {
  const [mode, setMode] = useState<Mode>("kolom");
  const [saring, setSaring] = useState<Saring>("semua");
  const [kat, setKat] = useState("semua");
  const [lihat, setLihat] = useState<ItemGambar | null>(null);
  const { per, setPer, hal, setHal } = useHalaman("adm-per-gambar");

  useEffect(() => {
    try { if (localStorage.getItem(KUNCI) === "baris") setMode("baris"); } catch { /* abaikan */ }
  }, []);
  const pilih = (m: Mode) => { setMode(m); try { localStorage.setItem(KUNCI, m); } catch { /* abaikan */ } };
  const ubahSaring = (v: Saring) => { setSaring(v); setHal(1); };

  const nTerbit = items.filter((x) => x.status === "published").length;
  const nDraft = items.length - nTerbit;
  const terfilter = items.filter((x) => (saring === "terbit" ? x.status === "published" : saring === "draft" ? x.status !== "published" : true) && cocokKat(kat, x.categoryId));
  const { baris: tampil, jumlah: jumlahHal, hal: halIni } = potong(terfilter, hal, per);
  const judulDaftar = saring === "terbit" ? "Gambar terbit" : saring === "draft" ? "Gambar draft" : "Semua gambar";
  const namaKat = (id: number | null) => cats.find((c) => c.id === id)?.name;

  const chip = (x: ItemGambar) => (
    <>
      <span className={`a-chip ${x.status === "published" ? "a-chip-hijau" : "a-chip-abu"}`}>{x.status === "published" ? "terbit" : "draft"}</span>
      {namaKat(x.categoryId) && <span className="a-chip a-chip-abu">{namaKat(x.categoryId)}</span>}
    </>
  );
  const tombolLihat = (x: ItemGambar) => (
    <button type="button" onClick={() => setLihat(x)} className="a-btn-soft !px-3 !py-1 text-sm" aria-label={`Lihat gambar: ${x.title}`}>
      <svg {...g} className="h-4 w-4"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>Lihat
    </button>
  );
  const ikonEdit = (x: ItemGambar) => <IkonEdit href={`/admin/gambar?edit=${x.id}`} label="Edit gambar" />;
  const formHapus = (x: ItemGambar) => (
    <form action={hapus}>
      <input type="hidden" name="id" value={x.id} />
      <IkonHapus label="Hapus gambar" pesan={`Hapus gambar "${x.title}"? Tindakan ini tidak bisa dibatalkan.`} />
    </form>
  );

  return (
    <div>
      <BarDaftar
        judul={<h2 className="font-medium">{judulDaftar} ({terfilter.length})</h2>}
        saring={<div className="a-tab-baris" role="group" aria-label="Saring gambar">
            <button type="button" className="a-tab" aria-current={saring === "semua" ? "page" : undefined} onClick={() => ubahSaring("semua")}>
              <svg {...g} className="h-4 w-4"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>Semua <span className="a-tab-n">{items.length}</span>
            </button>
            <button type="button" className="a-tab" aria-current={saring === "terbit" ? "page" : undefined} onClick={() => ubahSaring("terbit")}>
              <svg {...g} className="h-4 w-4"><circle cx="12" cy="12" r="9" /><path d="M8 12.5l3 3 5-6" /></svg>Gambar terbit <span className="a-tab-n">{nTerbit}</span>
            </button>
            <button type="button" className="a-tab" aria-current={saring === "draft" ? "page" : undefined} onClick={() => ubahSaring("draft")}>
              <svg {...g} className="h-4 w-4"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" /></svg>Draft <span className="a-tab-n">{nDraft}</span>
            </button>
          </div>}
        tampilan={<div className="a-tab-baris" role="group" aria-label="Tampilan daftar gambar">
            <button type="button" className="a-tab" aria-current={mode === "baris" ? "page" : undefined} onClick={() => pilih("baris")}>
              <svg {...g} className="h-4 w-4"><path d="M4 6h16M4 12h16M4 18h16" /></svg>Baris
            </button>
            <button type="button" className="a-tab" aria-current={mode === "kolom" ? "page" : undefined} onClick={() => pilih("kolom")}>
              <svg {...g} className="h-4 w-4"><rect x="4" y="4" width="7" height="7" rx="1" /><rect x="13" y="4" width="7" height="7" rx="1" /><rect x="4" y="13" width="7" height="7" rx="1" /><rect x="13" y="13" width="7" height="7" rx="1" /></svg>Kolom
            </button>
          </div>}
        kontrol={<><PilihKategori kats={cats} nilai={kat} ubah={(v) => { setKat(v); setHal(1); }} />
        <PilihJumlah per={per} ubah={setPer} /></>}
      />

      {tampil.length === 0 ? (
        <p className="a-muted mt-2 text-sm">{items.length === 0 ? "Belum ada gambar." : "Tidak ada gambar pada pilihan ini."}</p>
      ) : mode === "baris" ? (
        <ul className="a-card a-daftar mt-3">
          {tampil.map((x) => (
            <li key={x.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={kecil(x.url, 160)} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" className="h-12 w-16 shrink-0 rounded object-cover" />
                <div className="min-w-0">
                  <button type="button" onClick={() => setLihat(x)} className="text-left font-medium hover:text-[color:var(--a-accent)]" title="Lihat gambar">{x.title}</button>
                  <span className="ml-2 inline-flex flex-wrap gap-1.5 align-middle">{chip(x)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">{tombolLihat(x)}{ikonEdit(x)}{formHapus(x)}</div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {tampil.map((x) => (
            <div key={x.id} className="a-card flex flex-col [contain-intrinsic-size:auto_21rem] [content-visibility:auto]">
              <button type="button" onClick={() => setLihat(x)} className="group relative block aspect-video w-full overflow-hidden rounded-t-[inherit] bg-black" aria-label={`Lihat gambar: ${x.title}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={kecil(x.url, 640)} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" className="h-full w-full object-cover opacity-95 transition group-hover:opacity-100" />
              </button>
              <div className="flex flex-1 flex-col gap-2 p-3">
                <button type="button" onClick={() => setLihat(x)} className="line-clamp-3 text-left text-sm font-medium hover:text-[color:var(--a-accent)]" title="Lihat gambar">{x.title}</button>
                <div className="flex flex-wrap items-center gap-1.5">{chip(x)}</div>
                <div className="mt-auto flex items-center justify-between pt-1">{tombolLihat(x)}<span className="flex items-center gap-1">{ikonEdit(x)}{formHapus(x)}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pager hal={halIni} jumlah={jumlahHal} ubah={setHal} />
      {lihat && <Pratinjau x={lihat} onTutup={() => setLihat(null)} />}
    </div>
  );
}

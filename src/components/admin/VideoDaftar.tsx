// PAKET-15B: daftar video di CMS dengan tampilan Baris atau Kolom (pilihan diingat) dan tombol Lihat (pemutar tersemat).
"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ConfirmButton } from "@/components/ConfirmButton";
import { PemutarVideo } from "@/components/admin/PemutarVideo";
import { MiniPemutar } from "@/components/admin/MiniPemutar";
import { PilihKategori, PilihJumlah, Pager, useHalaman, potong, cocokKat, type Kat } from "@/components/admin/KontrolDaftar";

export type ItemVideo = { id: number; title: string; status: string; featured: boolean; youtubeId: string; categoryId: number | null };
type Mode = "baris" | "kolom";
type Saring = "semua" | "terbit" | "pilihan";
const KUNCI = "adm-video-tampil";
const g = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export function VideoDaftar({ items, hapus, cats }: { items: ItemVideo[]; hapus: (fd: FormData) => void | Promise<void>; cats: Kat[] }) {
  const [mode, setMode] = useState<Mode>("kolom");
  const [modal, setModal] = useState<{ x: ItemVideo; awal: "kecil" | "besar" } | null>(null);
  const [mini, setMini] = useState<ItemVideo | null>(null);
  const [inline, setInline] = useState<number | null>(null); // video yang sedang diputar langsung di kartu (tampilan Kolom)
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
    <button type="button" onClick={() => { setInline(null); setModal({ x, awal: "kecil" }); }} className="a-btn-soft !px-3 !py-1 text-sm" aria-label={`Lihat video: ${x.title}`}>
      <svg {...g} className="h-4 w-4"><path d="M8 5v14l11-7z" /></svg>Lihat
    </button>
  );
  const formHapus = (x: ItemVideo) => (
    <form action={hapus}>
      <input type="hidden" name="id" value={x.id} />
      <ConfirmButton pesan={`Hapus video "${x.title}"? Tindakan ini tidak bisa dibatalkan.`} />
    </form>
  );

  return (
    <div>
      <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-medium">{judulDaftar} ({terfilter.length})</h2>
        <div className="flex flex-wrap items-center gap-2">
        <div className="a-tab-baris" role="group" aria-label="Saring video">
          <button type="button" className="a-tab" aria-current={saring === "semua" ? "page" : undefined} onClick={() => ubahSaring("semua")}>
            <svg {...g} className="h-4 w-4"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>Semua <span className="a-tab-n">{items.length}</span>
          </button>
          <button type="button" className="a-tab" aria-current={saring === "terbit" ? "page" : undefined} onClick={() => ubahSaring("terbit")}>
            <svg {...g} className="h-4 w-4"><circle cx="12" cy="12" r="9" /><path d="M8 12.5l3 3 5-6" /></svg>Video terbit <span className="a-tab-n">{nTerbit}</span>
          </button>
          <button type="button" className="a-tab" aria-current={saring === "pilihan" ? "page" : undefined} onClick={() => ubahSaring("pilihan")}>
            <svg {...g} className="h-4 w-4"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.8 6.8 19.6l1-5.8L3.5 9.7l5.9-.9z" /></svg>Video pilihan <span className="a-tab-n">{nPilihan}</span>
          </button>
        </div>
        <div className="a-tab-baris" role="group" aria-label="Tampilan daftar video">
          <button type="button" className="a-tab" aria-current={mode === "baris" ? "page" : undefined} onClick={() => pilih("baris")}>
            <svg {...g} className="h-4 w-4"><path d="M4 6h16M4 12h16M4 18h16" /></svg>Baris
          </button>
          <button type="button" className="a-tab" aria-current={mode === "kolom" ? "page" : undefined} onClick={() => pilih("kolom")}>
            <svg {...g} className="h-4 w-4"><rect x="4" y="4" width="7" height="7" rx="1" /><rect x="13" y="4" width="7" height="7" rx="1" /><rect x="4" y="13" width="7" height="7" rx="1" /><rect x="13" y="13" width="7" height="7" rx="1" /></svg>Kolom
          </button>
        </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
        <PilihKategori kats={cats} nilai={kat} ubah={(v) => { setKat(v); setHal(1); }} />
        <PilihJumlah per={per} ubah={setPer} />
      </div>

      {tampil.length === 0 ? (
        <p className="a-muted mt-2 text-sm">{items.length === 0 ? "Belum ada video." : "Tidak ada video pada pilihan ini."}</p>
      ) : mode === "baris" ? (
        <ul className="a-card a-daftar mt-3 overflow-hidden">
          {tampil.map((x) => (
            <li key={x.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0 flex-1">
                <Link href={`/admin/video?edit=${x.id}`} className="font-medium hover:text-[color:var(--a-accent)]">{x.title}</Link>
                <span className="ml-2 inline-flex gap-1.5 align-middle">{chip(x)}</span>
              </div>
              <div className="flex items-center gap-3">{tombolLihat(x)}{formHapus(x)}</div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {tampil.map((x) => (
            <div key={x.id} className="a-card flex flex-col overflow-hidden">
              {inline === x.id ? (
                <div className="aspect-video w-full bg-black">
                  <iframe src={`https://www.youtube-nocookie.com/embed/${x.youtubeId}?autoplay=1&rel=0`} title={x.title} className="h-full w-full" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" />
                </div>
              ) : (
                <button type="button" onClick={() => { setMini(null); setInline(x.id); }} className="group relative block aspect-video w-full bg-black" aria-label={`Putar video: ${x.title}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`https://i.ytimg.com/vi/${x.youtubeId}/mqdefault.jpg`} alt="" loading="lazy" className="h-full w-full object-cover opacity-90 transition group-hover:opacity-100" />
                  <span className="absolute inset-0 grid place-items-center">
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-black/60 text-white transition group-hover:scale-110"><svg {...g} className="h-6 w-6" fill="currentColor"><path d="M8 5v14l11-7z" /></svg></span>
                  </span>
                </button>
              )}
              <div className="flex flex-1 flex-col gap-2 p-3">
                <Link href={`/admin/video?edit=${x.id}`} className="line-clamp-3 text-sm font-medium hover:text-[color:var(--a-accent)]">{x.title}</Link>
                <div className="flex flex-wrap items-center gap-1.5">{chip(x)}</div>
                <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                  <button type="button" onClick={() => { setMini(null); setInline((i) => (i === x.id ? null : x.id)); }} className="a-btn-soft !px-3 !py-1 text-sm" aria-label={inline === x.id ? `Hentikan video: ${x.title}` : `Putar video: ${x.title}`}>
                    {inline === x.id
                      ? <><svg {...g} className="h-4 w-4"><rect x="6" y="6" width="12" height="12" rx="1.5" fill="currentColor" /></svg>Berhenti</>
                      : <><svg {...g} className="h-4 w-4"><path d="M8 5v14l11-7z" /></svg>Putar</>}
                  </button>
                  <button type="button" onClick={() => { setInline(null); setModal({ x, awal: "kecil" }); }} className="a-ikon-btn !h-8 !w-8" aria-label={`Perbesar: ${x.title}`} title="Perbesar">
                    <svg {...g} className="h-4 w-4"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
                  </button>
                  <button type="button" onClick={() => { setInline(null); setMini(x); }} className="a-ikon-btn !h-8 !w-8" aria-label={`Mini player: ${x.title}`} title="Mini player">
                    <svg {...g} className="h-4 w-4"><rect x="3" y="5" width="18" height="14" rx="2" /><rect x="12" y="11" width="7" height="5" rx="1" fill="currentColor" /></svg>
                  </button>
                  <span className="ml-auto">{formHapus(x)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pager hal={halIni} jumlah={jumlahHal} ubah={setHal} />

      {modal && (
        <PemutarVideo
          key={modal.x.id}
          judul={modal.x.title}
          sumber={{ tipe: "youtube", id: modal.x.youtubeId }}
          awal={modal.awal}
          onTutup={() => setModal(null)}
          onMini={() => { setMini(modal.x); setModal(null); }}
        />
      )}
      {mini && (
        <MiniPemutar
          key={mini.id}
          judul={mini.title}
          sumber={{ tipe: "youtube", id: mini.youtubeId }}
          onTutup={() => setMini(null)}
          onBesar={() => { setModal({ x: mini, awal: "kecil" }); setMini(null); }}
        />
      )}
    </div>
  );
}

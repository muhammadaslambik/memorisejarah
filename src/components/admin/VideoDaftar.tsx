// PAKET-15B: daftar video di CMS dengan tampilan Baris atau Kolom (pilihan diingat) dan tombol Lihat (pemutar tersemat).
"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ConfirmButton } from "@/components/ConfirmButton";
import { PemutarVideo } from "@/components/admin/PemutarVideo";

export type ItemVideo = { id: number; title: string; status: string; featured: boolean; youtubeId: string };
type Mode = "baris" | "kolom";
const KUNCI = "adm-video-tampil";
const g = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export function VideoDaftar({ items, hapus }: { items: ItemVideo[]; hapus: (fd: FormData) => void | Promise<void> }) {
  const [mode, setMode] = useState<Mode>("baris");
  const [putar, setPutar] = useState<ItemVideo | null>(null);

  useEffect(() => {
    try { if (localStorage.getItem(KUNCI) === "kolom") setMode("kolom"); } catch { /* abaikan */ }
  }, []);
  const pilih = (m: Mode) => { setMode(m); try { localStorage.setItem(KUNCI, m); } catch { /* abaikan */ } };

  const chip = (x: ItemVideo) => (
    <>
      <span className={`a-chip ${x.status === "published" ? "a-chip-hijau" : "a-chip-abu"}`}>{x.status === "published" ? "terbit" : "draft"}</span>
      {x.featured && <span className="a-chip a-chip-kuning">pilihan</span>}
    </>
  );
  const tombolLihat = (x: ItemVideo) => (
    <button type="button" onClick={() => setPutar(x)} className="a-btn-soft !px-3 !py-1 text-sm" aria-label={`Lihat video: ${x.title}`}>
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
        <h2 className="font-medium">Semua video ({items.length})</h2>
        <div className="a-tab-baris" role="group" aria-label="Tampilan daftar video">
          <button type="button" className="a-tab" aria-current={mode === "baris" ? "page" : undefined} onClick={() => pilih("baris")}>
            <svg {...g} className="h-4 w-4"><path d="M4 6h16M4 12h16M4 18h16" /></svg>Baris
          </button>
          <button type="button" className="a-tab" aria-current={mode === "kolom" ? "page" : undefined} onClick={() => pilih("kolom")}>
            <svg {...g} className="h-4 w-4"><rect x="4" y="4" width="7" height="7" rx="1" /><rect x="13" y="4" width="7" height="7" rx="1" /><rect x="4" y="13" width="7" height="7" rx="1" /><rect x="13" y="13" width="7" height="7" rx="1" /></svg>Kolom
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="a-muted mt-2 text-sm">Belum ada video.</p>
      ) : mode === "baris" ? (
        <ul className="a-card a-daftar mt-3 overflow-hidden">
          {items.map((x) => (
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
          {items.map((x) => (
            <div key={x.id} className="a-card flex flex-col overflow-hidden">
              <button type="button" onClick={() => setPutar(x)} className="group relative block aspect-video w-full bg-black" aria-label={`Lihat video: ${x.title}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`https://i.ytimg.com/vi/${x.youtubeId}/mqdefault.jpg`} alt="" loading="lazy" className="h-full w-full object-cover opacity-90 transition group-hover:opacity-100" />
                <span className="absolute inset-0 grid place-items-center">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-black/60 text-white transition group-hover:scale-110"><svg {...g} className="h-6 w-6" fill="currentColor"><path d="M8 5v14l11-7z" /></svg></span>
                </span>
              </button>
              <div className="flex flex-1 flex-col gap-2 p-3">
                <Link href={`/admin/video?edit=${x.id}`} className="line-clamp-3 text-sm font-medium hover:text-[color:var(--a-accent)]">{x.title}</Link>
                <div className="flex flex-wrap items-center gap-1.5">{chip(x)}</div>
                <div className="mt-auto flex items-center justify-between pt-1">{tombolLihat(x)}{formHapus(x)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {putar && <PemutarVideo judul={putar.title} sumber={{ tipe: "youtube", id: putar.youtubeId }} onTutup={() => setPutar(null)} />}
    </div>
  );
}

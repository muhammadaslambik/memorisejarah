// PAKET-14B: jendela potong (crop) gambar. Tidak merusak berkas asli: hasilnya hanya parameter potong pada alamat ImageKit
// (?tr=cm-extract,x-,y-,w-,h-), sehingga tidak menambah ruang penyimpanan dan potongan bisa diubah atau dibatalkan kapan saja.
"use client";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";

export type Rect = { x: number; y: number; w: number; h: number }; // persen dari gambar asli
export type HasilPotong = { rect: Rect; px: { x: number; y: number; w: number; h: number } } | null;
type Pegangan = "pindah" | "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

const MIN = 5;
const RASIO: { label: string; r: number | null }[] = [
  { label: "Bebas", r: null }, { label: "1:1", r: 1 }, { label: "4:3", r: 4 / 3 }, { label: "3:2", r: 3 / 2 },
  { label: "16:9", r: 16 / 9 }, { label: "3:4", r: 3 / 4 }, { label: "9:16", r: 9 / 16 },
];
const TITIK: { p: Pegangan; gaya: React.CSSProperties; kursor: string }[] = [
  { p: "nw", gaya: { left: -7, top: -7 }, kursor: "nwse-resize" }, { p: "n", gaya: { left: "50%", top: -7, marginLeft: -6 }, kursor: "ns-resize" },
  { p: "ne", gaya: { right: -7, top: -7 }, kursor: "nesw-resize" }, { p: "e", gaya: { right: -7, top: "50%", marginTop: -6 }, kursor: "ew-resize" },
  { p: "se", gaya: { right: -7, bottom: -7 }, kursor: "nwse-resize" }, { p: "s", gaya: { left: "50%", bottom: -7, marginLeft: -6 }, kursor: "ns-resize" },
  { p: "sw", gaya: { left: -7, bottom: -7 }, kursor: "nesw-resize" }, { p: "w", gaya: { left: -7, top: "50%", marginTop: -6 }, kursor: "ew-resize" },
];
const jepit = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
const bulat = (n: number) => Math.round(n * 100) / 100;

export function PotongGambar({ src, awal, tutup, terapkan }: { src: string; awal: Rect | null; tutup: () => void; terapkan: (h: HasilPotong) => void }) {
  const kotak = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<Rect>(awal ?? { x: 10, y: 10, w: 80, h: 80 });
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const [siap, setSiap] = useState(false);
  useEffect(() => setSiap(true), []);
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") tutup(); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [tutup]);

  const mulai = (p: Pegangan) => (e: ReactPointerEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const b = kotak.current?.getBoundingClientRect();
    if (!b) return;
    const r0 = rect;
    const x0 = e.clientX;
    const y0 = e.clientY;
    const gerak = (ev: PointerEvent) => {
      const dx = ((ev.clientX - x0) / b.width) * 100;
      const dy = ((ev.clientY - y0) / b.height) * 100;
      let { x, y, w, h } = r0;
      if (p === "pindah") {
        x = jepit(r0.x + dx, 0, 100 - r0.w);
        y = jepit(r0.y + dy, 0, 100 - r0.h);
      } else {
        if (p.includes("w")) { x = jepit(r0.x + dx, 0, r0.x + r0.w - MIN); w = r0.w + (r0.x - x); }
        if (p.includes("e")) { w = jepit(r0.w + dx, MIN, 100 - r0.x); }
        if (p.includes("n")) { y = jepit(r0.y + dy, 0, r0.y + r0.h - MIN); h = r0.h + (r0.y - y); }
        if (p.includes("s")) { h = jepit(r0.h + dy, MIN, 100 - r0.y); }
      }
      setRect({ x: bulat(x), y: bulat(y), w: bulat(w), h: bulat(h) });
    };
    const selesai = () => { window.removeEventListener("pointermove", gerak); window.removeEventListener("pointerup", selesai); };
    window.addEventListener("pointermove", gerak);
    window.addEventListener("pointerup", selesai);
  };

  // Persegi terbesar dengan rasio tertentu, di tengah gambar
  const pasRasio = (r: number | null) => {
    if (r === null || !nat) return;
    let w = 100;
    let h = (100 * nat.w) / (nat.h * r);
    if (h > 100) { h = 100; w = (100 * r * nat.h) / nat.w; }
    setRect({ x: bulat((100 - w) / 2), y: bulat((100 - h) / 2), w: bulat(w), h: bulat(h) });
  };

  const ok = () => {
    if (!nat) return;
    const x = Math.round((rect.x / 100) * nat.w);
    const y = Math.round((rect.y / 100) * nat.h);
    const w = Math.max(8, Math.min(nat.w - x, Math.round((rect.w / 100) * nat.w)));
    const h = Math.max(8, Math.min(nat.h - y, Math.round((rect.h / 100) * nat.h)));
    terapkan({ rect, px: { x, y, w, h } });
  };

  if (!siap) return null;
  return createPortal(
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Potong gambar" onMouseDown={(e) => { if (e.target === e.currentTarget) tutup(); }}>
      <div className="flex max-h-[94vh] w-full max-w-3xl flex-col gap-3 rounded-xl p-4 shadow-2xl" style={{ background: "#fffaf0", color: "#2a1b0f" }}>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <strong className="mr-2 text-base">Potong gambar</strong>
          {RASIO.map((x) => (
            <button key={x.label} type="button" onClick={() => pasRasio(x.r)} disabled={x.r !== null && !nat} className="rounded-md border px-2.5 py-1 hover:bg-black/5 disabled:opacity-40" style={{ borderColor: "#cdbd9f" }}>{x.label}</button>
          ))}
        </div>
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto rounded-lg p-2" style={{ background: "#2a1b0f" }}>
          <div ref={kotak} className="relative inline-block touch-none select-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" draggable={false} onLoad={(e) => setNat({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })} className="block max-h-[62vh] max-w-full" />
            <div
              onPointerDown={mulai("pindah")}
              style={{ position: "absolute", left: `${rect.x}%`, top: `${rect.y}%`, width: `${rect.w}%`, height: `${rect.h}%`, boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)", border: "2px solid #fff", cursor: "move" }}
            >
              {TITIK.map((t) => (
                <span key={t.p} onPointerDown={mulai(t.p)} style={{ position: "absolute", width: 12, height: 12, background: "#b8893a", border: "2px solid #fffaf0", borderRadius: 3, cursor: t.kursor, ...t.gaya }} />
              ))}
            </div>
          </div>
        </div>
        <p className="text-xs opacity-70">
          Geser kotak untuk memindahkan, tarik titik di sudut/sisi untuk mengubah ukuran potongan.
          {nat ? ` Ukuran asli ${nat.w} x ${nat.h} px; potongan ${Math.round((rect.w / 100) * nat.w)} x ${Math.round((rect.h / 100) * nat.h)} px.` : " Memuat gambar..."}
          {" "}Berkas asli tidak berubah.
        </p>
        <div className="flex flex-wrap justify-end gap-2 text-sm">
          <button type="button" onClick={tutup} className="rounded-full border px-4 py-2 hover:bg-black/5" style={{ borderColor: "#cdbd9f" }}>Batal</button>
          <button type="button" onClick={() => terapkan(null)} className="rounded-full border px-4 py-2 hover:bg-black/5" style={{ borderColor: "#cdbd9f" }}>Hapus potongan</button>
          <button type="button" onClick={ok} disabled={!nat} className="rounded-full px-5 py-2 font-semibold text-white disabled:opacity-50" style={{ background: "#b8893a" }}>Terapkan</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

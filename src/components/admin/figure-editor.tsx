// PAKET-14B (dasar PAKET-12E): gambar di editor artikel yang bisa dikelola: klik untuk memilih, tarik titik di sudut/sisi untuk mengubah ukuran,
// "Geser" untuk memindahkan, rata kiri/tengah/kanan, teks di atas gambar (keterangan ditumpuk di atas/tengah/bawah), teks alt, hapus.
// Pengaturan disimpan sebagai atribut data-* pada <figure> (aman, lolos penyaring HTML) dan ditampilkan lewat CSS di halaman publik.
"use client";
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";
import { Figure, ekstensiEditor } from "../editor-ekstensi";
import { PotongGambar, type HasilPotong, type Rect } from "./potong-gambar";

type Arah = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";
const TITIK: { arah: Arah; gaya: CSSProperties; kursor: string }[] = [
  { arah: "nw", gaya: { left: -7, top: -7 }, kursor: "nwse-resize" },
  { arah: "n", gaya: { left: "50%", top: -7, marginLeft: -6 }, kursor: "ns-resize" },
  { arah: "ne", gaya: { right: -7, top: -7 }, kursor: "nesw-resize" },
  { arah: "e", gaya: { right: -7, top: "50%", marginTop: -6 }, kursor: "ew-resize" },
  { arah: "se", gaya: { right: -7, bottom: -7 }, kursor: "nwse-resize" },
  { arah: "s", gaya: { left: "50%", bottom: -7, marginLeft: -6 }, kursor: "ns-resize" },
  { arah: "sw", gaya: { left: -7, bottom: -7 }, kursor: "nesw-resize" },
  { arah: "w", gaya: { left: -7, top: "50%", marginTop: -6 }, kursor: "ew-resize" },
];

const warnaBilah: CSSProperties = { background: "#fffaf0", color: "#2a1b0f", borderColor: "#cdbd9f" };

function FigureView({ node, updateAttributes, deleteNode, editor, getPos }: NodeViewProps) {
  const akar = useRef<HTMLElement>(null);
  const [aktif, setAktif] = useState(false);
  const lebar = (node.attrs.lebar as number | null) ?? null;
  const rata = (node.attrs.rata as string | null) ?? null;
  const tumpuk = (node.attrs.tumpuk as string | null) ?? null;
  const ar = (node.attrs.ar as number | null) ?? null; // rasio lebar:tinggi bingkai (null = bentuk asli)
  const isi = (node.attrs.isi as string | null) ?? null; // "regang" = gambar diregangkan; kosong = pas (tepi dipotong)
  const crop = (node.attrs.crop as string | null) ?? null; // "x,y,w,h" (persen) potongan
  const [potong, setPotong] = useState(false);
  const srcGambar = String(node.firstChild?.attrs.src ?? "");
  const bisaPotong = /^https:\/\/ik\.imagekit\.io\//i.test(srcGambar);

  // Kontrol tampil saat kursor/pilihan berada di dalam gambar ini (gambar atau keterangannya)
  useEffect(() => {
    const cek = () => {
      const p = getPos();
      if (typeof p !== "number") return;
      const { from, to } = editor.state.selection;
      setAktif(from >= p && to <= p + node.nodeSize);
    };
    cek();
    editor.on("selectionUpdate", cek);
    editor.on("update", cek);
    return () => { editor.off("selectionUpdate", cek); editor.off("update", cek); };
  }, [editor, getPos, node.nodeSize]);

  const mulaiUbah = (arah: Arah) => (e: ReactPointerEvent<HTMLSpanElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const el = akar.current;
    const induk = el?.parentElement;
    if (!el || !induk) return;
    const gbr = el.querySelector("img");
    const r = el.getBoundingClientRect();
    const w0 = r.width;
    const h0 = (gbr ?? el).getBoundingClientRect().height || 1;
    const x0 = e.clientX;
    const y0 = e.clientY;
    const lebarInduk = induk.getBoundingClientRect().width || 1;
    const sx = arah.includes("w") ? -1 : 1;
    const sy = arah.includes("n") ? -1 : 1;
    const faktor = rata === "kiri" || rata === "kanan" ? 1 : 2; // gambar di tengah tumbuh ke dua sisi
    let terakhir = "";
    let bingkai = 0;
    const gerak = (ev: PointerEvent) => {
      const dx = ev.clientX - x0;
      const dy = ev.clientY - y0;
      let w = w0;
      let h = h0;
      let ubahAr = true;
      if (arah === "e" || arah === "w") w = w0 + sx * dx * faktor; // sisi kiri/kanan: lebar saja, tinggi tetap
      else if (arah === "n" || arah === "s") h = h0 + sy * dy; // sisi atas/bawah: tinggi saja, lebar tetap
      else {
        w = w0 + sx * dx * faktor; // sudut: proporsional; tahan Shift untuk bebas
        if (ev.shiftKey) h = h0 + sy * dy;
        else { h = (w / w0) * h0; ubahAr = false; }
      }
      const pct = Math.max(10, Math.min(100, Math.round((w / lebarInduk) * 100)));
      const wNyata = (pct / 100) * lebarInduk;
      const baru: Record<string, unknown> = { lebar: pct };
      if (ubahAr) baru.ar = Math.max(0.2, Math.min(6, Math.round((wNyata / Math.max(24, h)) * 1000) / 1000));
      const kunci = JSON.stringify(baru);
      if (kunci === terakhir) return;
      terakhir = kunci;
      cancelAnimationFrame(bingkai);
      bingkai = requestAnimationFrame(() => updateAttributes(baru));
    };
    const selesai = () => { window.removeEventListener("pointermove", gerak); window.removeEventListener("pointerup", selesai); };
    window.addEventListener("pointermove", gerak);
    window.addEventListener("pointerup", selesai);
  };

  const terapkanPotong = (h: HasilPotong) => {
    setPotong(false);
    const p = getPos();
    const gbr = node.firstChild;
    if (typeof p !== "number" || !gbr || gbr.type.name !== "image") return;
    const dasar = String(gbr.attrs.src).split("?")[0];
    const src = h ? `${dasar}?tr=cm-extract,x-${h.px.x},y-${h.px.y},w-${h.px.w},h-${h.px.h}` : dasar;
    const tr = editor.state.tr.setNodeMarkup(p + 1, undefined, { ...gbr.attrs, src });
    tr.setNodeMarkup(p, undefined, { ...node.attrs, crop: h ? `${h.rect.x},${h.rect.y},${h.rect.w},${h.rect.h}` : null, ar: null, isi: null });
    editor.view.dispatch(tr);
  };
  const rectAwal: Rect | null = (() => {
    if (!crop) return null;
    const [x, y, w, h] = crop.split(",").map(Number);
    return [x, y, w, h].every(Number.isFinite) ? { x, y, w, h } : null;
  })();

  const ubahAlt = () => {
    const p = getPos();
    const gbr = node.firstChild;
    if (typeof p !== "number" || !gbr || gbr.type.name !== "image") return;
    const baru = window.prompt("Teks alternatif gambar (dibaca pembaca layar dan mesin pencari). Kosongkan untuk menghapus.", String(gbr.attrs.alt ?? ""));
    if (baru === null) return;
    editor.view.dispatch(editor.state.tr.setNodeMarkup(p + 1, undefined, { ...gbr.attrs, alt: baru.trim().slice(0, 300) }));
  };

  const B = (isi: ReactNode, aktifTombol: boolean, onClick: () => void, judul?: string, bahaya = false) => (
    <button
      type="button"
      title={judul}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      style={{ background: aktifTombol ? "#e3d3ae" : "transparent", color: bahaya ? "#b42318" : "inherit", fontWeight: aktifTombol ? 700 : 400, padding: "3px 8px", borderRadius: 6 }}
    >
      {isi}
    </button>
  );
  const Pisah = () => <span aria-hidden="true" style={{ width: 1, height: 18, background: "#cdbd9f", margin: "0 2px" }} />;

  return (
    <NodeViewWrapper
      as="figure"
      ref={akar}
      data-w={lebar ?? undefined}
      data-rata={rata ?? undefined}
      data-tumpuk={tumpuk ?? undefined}
      data-ar={ar ?? undefined}
      data-isi={isi ?? undefined}
      data-crop={crop ?? undefined}
      className="relative"
      style={{ width: lebar ? `${lebar}%` : undefined, ["--ar" as string]: ar ?? undefined, outline: aktif ? "2px solid #b8893a" : undefined, outlineOffset: 2 } as CSSProperties}
    >
      {aktif && (
        <div
          contentEditable={false}
          className="absolute left-1/2 z-30 flex flex-wrap items-center gap-0.5 rounded-lg border p-1 text-xs shadow-xl"
          style={{ ...warnaBilah, bottom: "calc(100% + 10px)", transform: "translateX(-50%)", width: "max-content", maxWidth: "min(94vw, 560px)", fontFamily: "inherit", lineHeight: 1.2 }}
        >
          <span data-drag-handle draggable="true" title="Tarik untuk memindahkan gambar ke tempat lain" style={{ cursor: "grab", padding: "3px 8px", borderRadius: 6, background: "#efe3c8" }}>Geser</span>
          <Pisah />
          {B("Kiri", rata === "kiri", () => updateAttributes({ rata: "kiri" }), "Gambar di kiri, teks mengalir di kanan")}
          {B("Tengah", rata === "tengah" || !rata, () => updateAttributes({ rata: null }), "Gambar di tengah")}
          {B("Kanan", rata === "kanan", () => updateAttributes({ rata: "kanan" }), "Gambar di kanan, teks mengalir di kiri")}
          <Pisah />
          <span style={{ opacity: 0.7, padding: "0 4px" }}>Teks di gambar:</span>
          {B("Mati", !tumpuk, () => updateAttributes({ tumpuk: null }), "Keterangan di bawah gambar")}
          {B("Atas", tumpuk === "atas", () => updateAttributes({ tumpuk: "atas" }), "Keterangan menumpuk di bagian atas gambar")}
          {B("Tengah", tumpuk === "tengah", () => updateAttributes({ tumpuk: "tengah" }), "Keterangan menumpuk di tengah gambar")}
          {B("Bawah", tumpuk === "bawah", () => updateAttributes({ tumpuk: "bawah" }), "Keterangan menumpuk di bagian bawah gambar")}
          <span style={{ flexBasis: "100%", height: 0 }} />
          {B(crop ? "Potong (diubah)" : "Potong", !!crop, () => (bisaPotong ? setPotong(true) : window.alert("Potong gambar hanya untuk gambar yang tersimpan di ImageKit (unggah atau pilih dari Galeri).")), "Potong bagian gambar yang ditampilkan (berkas asli tidak berubah)")}
          <Pisah />
          <span style={{ opacity: 0.7, padding: "0 4px" }}>Isi bingkai:</span>
          {B("Pas", ar !== null && isi !== "regang", () => updateAttributes({ isi: null }), "Gambar memenuhi bingkai; tepi yang berlebih terpotong (bentuk gambar tetap)")}
          {B("Regang", isi === "regang", () => updateAttributes({ isi: "regang" }), "Gambar diregangkan mengikuti bingkai (bentuk gambar berubah)")}
          <Pisah />
          {B("Alt", false, ubahAlt, "Teks alternatif gambar")}
          {B("Ukuran asli", false, () => updateAttributes({ lebar: null, ar: null, isi: null }), "Kembalikan ke lebar penuh dan bentuk asli")}
          {B("Hapus", false, () => deleteNode(), "Hapus gambar dari artikel", true)}
        </div>
      )}
      {potong && <PotongGambar src={srcGambar.split("?")[0]} awal={rectAwal} tutup={() => setPotong(false)} terapkan={terapkanPotong} />}
      {/* display: contents agar gambar dan keterangan tetap berperilaku seperti anak langsung <figure> */}
      <NodeViewContent style={{ display: "contents" }} />
      {aktif &&
        TITIK.map((t) => (
          <span
            key={t.arah}
            contentEditable={false}
            onPointerDown={mulaiUbah(t.arah)}
            title="Tarik untuk mengubah ukuran"
            style={{ position: "absolute", width: 12, height: 12, background: "#b8893a", border: "2px solid #fffaf0", borderRadius: 3, cursor: t.kursor, zIndex: 20, touchAction: "none", ...t.gaya }}
          />
        ))}
    </NodeViewWrapper>
  );
}

// <figure> yang sama dengan editor-ekstensi, ditambah atribut tampilan dan tampilan interaktif
export const FigureEditor = Figure.extend({
  addAttributes() {
    return {
      lebar: {
        default: null,
        parseHTML: (el: HTMLElement) => { const n = Number(el.getAttribute("data-w")); return Number.isInteger(n) && n >= 10 && n <= 100 ? n : null; },
        renderHTML: (a: Record<string, unknown>) => (a.lebar ? { "data-w": a.lebar } : {}),
      },
      rata: {
        default: null,
        parseHTML: (el: HTMLElement) => { const v = el.getAttribute("data-rata"); return v === "kiri" || v === "kanan" ? v : null; },
        renderHTML: (a: Record<string, unknown>) => (a.rata ? { "data-rata": a.rata } : {}),
      },
      ar: {
        default: null,
        parseHTML: (el: HTMLElement) => { const n = Number(el.getAttribute("data-ar")); return Number.isFinite(n) && n >= 0.2 && n <= 6 ? n : null; },
        renderHTML: (a: Record<string, unknown>) => (a.ar ? { "data-ar": a.ar } : {}),
      },
      isi: {
        default: null,
        parseHTML: (el: HTMLElement) => (el.getAttribute("data-isi") === "regang" ? "regang" : null),
        renderHTML: (a: Record<string, unknown>) => (a.isi ? { "data-isi": a.isi } : {}),
      },
      crop: {
        default: null,
        parseHTML: (el: HTMLElement) => { const v = el.getAttribute("data-crop"); return v && /^\d{1,3}(\.\d{1,2})?(,\d{1,3}(\.\d{1,2})?){3}$/.test(v) ? v : null; },
        renderHTML: (a: Record<string, unknown>) => (a.crop ? { "data-crop": a.crop } : {}),
      },
      tumpuk: {
        default: null,
        parseHTML: (el: HTMLElement) => { const v = el.getAttribute("data-tumpuk"); return v === "atas" || v === "tengah" || v === "bawah" ? v : null; },
        renderHTML: (a: Record<string, unknown>) => (a.tumpuk ? { "data-tumpuk": a.tumpuk } : {}),
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(FigureView);
  },
});

export const ekstensiEditorLengkap = ekstensiEditor.map((e) => (e.name === "figure" ? FigureEditor : e));

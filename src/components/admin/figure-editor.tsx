// PAKET-12E: gambar di editor artikel yang bisa dikelola: klik untuk memilih, tarik titik di sudut/sisi untuk mengubah ukuran,
// "Geser" untuk memindahkan, rata kiri/tengah/kanan, teks di atas gambar (keterangan ditumpuk di atas/tengah/bawah), teks alt, hapus.
// Pengaturan disimpan sebagai atribut data-* pada <figure> (aman, lolos penyaring HTML) dan ditampilkan lewat CSS di halaman publik.
"use client";
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";
import { Figure, ekstensiEditor } from "../editor-ekstensi";

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
    const r = el.getBoundingClientRect();
    const w0 = r.width;
    const h0 = r.height || 1;
    const x0 = e.clientX;
    const y0 = e.clientY;
    const lebarInduk = induk.getBoundingClientRect().width || 1;
    const sx = arah.includes("w") ? -1 : 1;
    const sy = arah.includes("n") ? -1 : 1;
    const horizontal = arah.length === 2 || arah === "e" || arah === "w"; // sudut dan sisi kiri/kanan memakai gerak mendatar
    const faktor = rata === "kiri" || rata === "kanan" ? 1 : 2; // gambar di tengah tumbuh ke dua sisi
    let terakhir = lebar ?? Math.round((w0 / lebarInduk) * 100);
    let bingkai = 0;
    const gerak = (ev: PointerEvent) => {
      const dw = horizontal ? sx * (ev.clientX - x0) : sy * (ev.clientY - y0) * (w0 / h0); // tinggi selalu mengikuti lebar (proporsi tetap)
      const pct = Math.max(10, Math.min(100, Math.round(((w0 + dw * faktor) / lebarInduk) * 100)));
      if (pct === terakhir) return;
      terakhir = pct;
      cancelAnimationFrame(bingkai);
      bingkai = requestAnimationFrame(() => updateAttributes({ lebar: pct }));
    };
    const selesai = () => { window.removeEventListener("pointermove", gerak); window.removeEventListener("pointerup", selesai); };
    window.addEventListener("pointermove", gerak);
    window.addEventListener("pointerup", selesai);
  };

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
      className="relative"
      style={{ width: lebar ? `${lebar}%` : undefined, outline: aktif ? "2px solid #b8893a" : undefined, outlineOffset: 2 }}
    >
      {aktif && (
        <div
          contentEditable={false}
          className="absolute left-1/2 z-30 flex items-center gap-0.5 whitespace-nowrap rounded-lg border p-1 text-xs shadow-xl"
          style={{ ...warnaBilah, top: -46, transform: "translateX(-50%)", fontFamily: "inherit", lineHeight: 1.2 }}
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
          <Pisah />
          {B("Alt", false, ubahAlt, "Teks alternatif gambar")}
          {B("Ukuran asli", false, () => updateAttributes({ lebar: null }), "Kembalikan ke lebar penuh")}
          {B("Hapus", false, () => deleteNode(), "Hapus gambar dari artikel", true)}
        </div>
      )}
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

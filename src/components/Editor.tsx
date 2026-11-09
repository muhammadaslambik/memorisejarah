// PAKET-11A: editor teks (WYSIWYG). Gambar dikecilkan di perangkat sebelum diunggah (lebih cepat), keterangan gambar diketik langsung.
// Pintasan: Ctrl+B tebal, Ctrl+I miring, Ctrl+U garis bawah, Ctrl+K tautan, Ctrl+Z urungkan, Ctrl+Y ulangi.
"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { ekstensiEditor } from "./editor-ekstensi";
import { unggahGambarArtikel } from "@/lib/unggah-actions";
import { hashBerkas } from "@/lib/gambar-klien";
import { GaleriGambar } from "@/components/admin/GaleriGambar";
import { AlatBahasa } from "@/components/admin/AlatBahasa";
import { MenuIkon, type Opsi } from "@/components/admin/MenuIkon";
import { ekstensiEditorLengkap } from "@/components/admin/figure-editor";
import { cariBahasa } from "@/lib/bahasa";
import { posisiCatatan, sisipCatatanKaki as sisipNomorCatatan } from "@/lib/catatan-kaki";

type Props = { initial: string; name?: string; catatanKaki?: boolean; tinggi?: number; awal?: ReactNode };

const garis = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

function Tombol(p: { judul: string; aktif?: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode; lebar?: boolean }) {
  return (
    <button
      type="button"
      title={p.judul}
      aria-label={p.judul}
      aria-pressed={p.aktif}
      disabled={p.disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={p.onClick}
      className={`grid h-8 place-items-center rounded-md text-sm transition disabled:opacity-30 ${p.lebar ? "px-2.5" : "w-8"} ${p.aktif ? "bg-charcoal text-cream" : "text-charcoal/80 hover:bg-black/5"}`}
    >
      {p.children}
    </button>
  );
}
const Pemisah = () => <span className="mx-1 h-5 w-px bg-black/15" aria-hidden="true" />;

// Mengecilkan gambar besar di perangkat pengguna (bukan di server): maksimal 2000 px, format WebP. GIF dibiarkan agar tetap bergerak.
export async function perkecil(file: File): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
  const bmp = await createImageBitmap(file).catch(() => null);
  if (!bmp) return file;
  const skala = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
  if (skala === 1 && file.size < 900_000) { bmp.close(); return file; }
  const w = Math.round(bmp.width * skala);
  const h = Math.round(bmp.height * skala);
  const kanvas = document.createElement("canvas");
  kanvas.width = w;
  kanvas.height = h;
  const ctx = kanvas.getContext("2d");
  if (!ctx) { bmp.close(); return file; }
  ctx.drawImage(bmp, 0, 0, w, h);
  bmp.close();
  const blob = await new Promise<Blob | null>((r) => kanvas.toBlob(r, "image/webp", 0.82));
  if (!blob || blob.type !== "image/webp" || blob.size >= file.size) return file;
  return new File([blob], file.name.replace(/\.\w+$/, "") + ".webp", { type: "image/webp" });
}
export const kb = (n: number) => (n > 1_000_000 ? `${(n / 1_000_000).toFixed(1)} MB` : `${Math.round(n / 1000)} KB`);

export function Editor({ initial, name = "content", catatanKaki = false, tinggi = 300, awal }: Props) {
  const [html, setHtml] = useState(initial);
  const [pesan, setPesan] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [ejaan, setEjaan] = useState(false);
  const [bahasa, setBahasa] = useState("id");
  const berkas = useRef<HTMLInputElement>(null);
  const aksiTautan = useRef<() => void>(() => {});
  const aksiCatatan = useRef<() => void>(() => {});
  const [galeri, setGaleri] = useState(false);
  const [penuh, setPenuh] = useState(false); // mode menulis layar penuh
  const [catatanBaru, setCatatanBaru] = useState<number | null>(null);
  const editor = useEditor({
    extensions: ekstensiEditorLengkap,
    content: initial,
    immediatelyRender: false,
    onUpdate: ({ editor }) => setHtml(editor.getHTML()),
    editorProps: {
      attributes: { lang: "id", class: "prose prose-stone max-w-none rounded-b-lg border bg-white p-4 text-charcoal focus:outline-none", style: `min-height:max(${tinggi}px, 55dvh)` },
      handleKeyDown: (_v, e) => {
        if (catatanKaki && (e.ctrlKey || e.metaKey) && e.altKey && e.code === "KeyF") { e.preventDefault(); aksiCatatan.current(); return true; }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); aksiTautan.current(); return true; }
        return false;
      },
    },
  });
  // Garis merah ejaan mati secara bawaan; tombol "Ejaan" menyalakannya (mengikuti kamus bahasa di browser)
  useEffect(() => {
    try {
      const dom = editor?.view.dom;
      dom?.setAttribute("spellcheck", ejaan ? "true" : "false");
      dom?.setAttribute("lang", cariBahasa(bahasa).lang);
    } catch { /* editor belum terpasang */ }
  }, [editor, ejaan, bahasa]);
  useEffect(() => {
    if (!penuh) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setPenuh(false); };
    const awalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", esc);
    return () => { document.body.style.overflow = awalOverflow; document.removeEventListener("keydown", esc); };
  }, [penuh]);
  const c = () => editor?.chain().focus();
  const ya = (nama: string, attrs?: Record<string, unknown>) => !!editor?.isActive(nama, attrs);
  const rata = (a: string) => !!editor?.isActive({ textAlign: a });

  // Gambar disisipkan dengan kolom keterangan kosong di bawahnya: klik di sana untuk mengetik (kosong = tidak ditampilkan)
  const sisipGambar = (src: string) => {
    c()?.insertContent({ type: "figure", content: [{ type: "image", attrs: { src, alt: "" } }, { type: "figcaption" }] }).run();
  };
  const unggah = async (f: File) => {
    setSibuk(true);
    try {
      setPesan("Mengecilkan gambar...");
      const hashAsli = await hashBerkas(f);
      const kecil = await perkecil(f);
      setPesan(`Mengunggah gambar (${kb(kecil.size)})...`);
      const fd = new FormData();
      fd.set("berkas", kecil);
      if (hashAsli) fd.set("hashAsli", hashAsli);
      const r = await unggahGambarArtikel(fd);
      if ("url" in r) { setPesan(r.dipakaiUlang ? "Gambar yang sama sudah ada di galeri; berkas yang ada dipakai ulang (hemat ruang)." : ""); sisipGambar(r.url); } else setPesan(r.galat);
    } catch {
      setPesan("Unggah gagal. Periksa koneksi lalu coba lagi.");
    } finally {
      setSibuk(false);
    }
  };
  const gambarUrl = () => {
    const url = window.prompt("Alamat gambar (https://...)");
    if (url && /^https:\/\//i.test(url.trim())) sisipGambar(url.trim());
    else if (url) setPesan("Alamat gambar harus diawali https://");
  };
  aksiTautan.current = () => {
    if (!editor) return;
    const url = window.prompt("Alamat tautan (https://... atau /halaman). Kosongkan untuk menghapus tautan.", editor.getAttributes("link").href ?? "");
    if (url === null) return;
    if (url.trim() === "") editor.chain().focus().unsetLink().run();
    else editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };
  const sisipCatatanKaki = () => {
    if (!editor) return;
    const h = sisipNomorCatatan(editor.state);
    if (!h) { setPesan("Letakkan kursor di dalam teks artikel dulu, lalu sisipkan catatan kaki."); return; }
    editor.view.dispatch(h.tr);
    editor.view.focus();
    setPesan("");
    setCatatanBaru(h.nomor);
  };
  aksiCatatan.current = sisipCatatanKaki;
  const lompatCatatan = () => {
    if (!editor || catatanBaru === null) return;
    const pos = posisiCatatan(editor.state, catatanBaru);
    if (pos !== null) editor.chain().focus().setTextSelection(pos).scrollIntoView().run();
  };

  const gaya = ya("heading", { level: 2 }) ? "2" : ya("heading", { level: 3 }) ? "3" : ya("heading", { level: 4 }) ? "4" : "p";

  return (
    <div className={`editor-kaya ${penuh ? "editor-penuh fixed inset-0 z-[45] overflow-y-auto p-2 sm:p-5" : ""}`} style={penuh ? { background: "var(--a-bg, #fff)" } : undefined}>
      <div className={`sticky z-10 flex flex-wrap items-center gap-0.5 rounded-t-lg border border-b-0 bg-cream-dark p-1 sm:p-1.5 ${penuh ? "top-0" : "top-[var(--adm-lengket,4rem)]"}`} role="toolbar" aria-label="Pemformatan teks">
        {awal}
        <MenuIkon
          tanpaFokus
          judul="Gaya paragraf"
          ikon={<svg {...garis} className="h-4 w-4"><path d="M13 4v16M17 4v16M13 4H9.5a4.5 4.5 0 000 9H13" /></svg>}
          opsi={([["p", "Paragraf"], ["2", "Judul besar"], ["3", "Judul sedang"], ["4", "Judul kecil"]] as const).map(([v, n]): Opsi => ({
            label: n, aktif: gaya === v,
            klik: () => { if (v === "p") c()?.setParagraph().run(); else c()?.setHeading({ level: Number(v) as 2 | 3 | 4 }).run(); },
          }))}
        />
        <Pemisah />
        <Tombol judul="Tebal (Ctrl+B)" aktif={ya("bold")} onClick={() => c()?.toggleBold().run()}><span className="font-bold">B</span></Tombol>
        <Tombol judul="Miring (Ctrl+I)" aktif={ya("italic")} onClick={() => c()?.toggleItalic().run()}><span className="font-serif italic">I</span></Tombol>
        <Tombol judul="Garis bawah (Ctrl+U)" aktif={ya("underline")} onClick={() => c()?.toggleUnderline().run()}><span className="underline">U</span></Tombol>
        <Tombol judul="Coret (Ctrl+Shift+S)" aktif={ya("strike")} onClick={() => c()?.toggleStrike().run()}><span className="line-through">S</span></Tombol>
        <Pemisah />
        <Tombol judul="Daftar titik" aktif={ya("bulletList")} onClick={() => c()?.toggleBulletList().run()}>
          <svg {...garis} className="h-4 w-4"><path d="M9 6h11M9 12h11M9 18h11" /><circle cx="4.5" cy="6" r="1" fill="currentColor" /><circle cx="4.5" cy="12" r="1" fill="currentColor" /><circle cx="4.5" cy="18" r="1" fill="currentColor" /></svg>
        </Tombol>
        <Tombol judul="Daftar bernomor" aktif={ya("orderedList")} onClick={() => c()?.toggleOrderedList().run()}>
          <svg {...garis} className="h-4 w-4"><path d="M10 6h10M10 12h10M10 18h10" /><path d="M4 5.5 5.2 5v3M4 11.5h2.2L4 14h2.2M4 17h2l-1 1.2 1 .8h-2" strokeWidth="1.4" /></svg>
        </Tombol>
        <Tombol judul="Kutipan" aktif={ya("blockquote")} onClick={() => c()?.toggleBlockquote().run()}><span className="font-serif text-lg leading-none">&ldquo;</span></Tombol>
        <Pemisah />
        <MenuIkon
          tanpaFokus
          judul="Perataan teks"
          ikon={rata("center")
            ? <svg {...garis} className="h-4 w-4"><path d="M4 6h16M7 10h10M4 14h16M7 18h10" /></svg>
            : rata("right")
              ? <svg {...garis} className="h-4 w-4"><path d="M4 6h16M10 10h10M4 14h16M10 18h10" /></svg>
              : rata("justify")
                ? <svg {...garis} className="h-4 w-4"><path d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                : <svg {...garis} className="h-4 w-4"><path d="M4 6h16M4 10h10M4 14h16M4 18h10" /></svg>}
          opsi={[
            { label: "Rata kiri", aktif: rata("left"), ikon: <svg {...garis} className="h-4 w-4"><path d="M4 6h16M4 10h10M4 14h16M4 18h10" /></svg>, klik: () => c()?.setTextAlign("left").run() },
            { label: "Rata tengah", aktif: rata("center"), ikon: <svg {...garis} className="h-4 w-4"><path d="M4 6h16M7 10h10M4 14h16M7 18h10" /></svg>, klik: () => c()?.setTextAlign("center").run() },
            { label: "Rata kanan", aktif: rata("right"), ikon: <svg {...garis} className="h-4 w-4"><path d="M4 6h16M10 10h10M4 14h16M10 18h10" /></svg>, klik: () => c()?.setTextAlign("right").run() },
            { label: "Rata kiri-kanan", aktif: rata("justify"), ikon: <svg {...garis} className="h-4 w-4"><path d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>, klik: () => c()?.setTextAlign("justify").run() },
          ]}
        />
        <Tombol judul="Tautan (Ctrl+K)" aktif={ya("link")} onClick={() => aksiTautan.current()}>
          <svg {...garis} className="h-4 w-4"><path d="M10 13a5 5 0 007.07 0l2.83-2.83a5 5 0 00-7.07-7.07L11.5 4.5M14 11a5 5 0 00-7.07 0L4.1 13.83a5 5 0 007.07 7.07L12.5 19.5" /></svg>
        </Tombol>
        <MenuIkon
          tanpaFokus
          judul="Sisipkan gambar"
          ikon={<svg {...garis} className="h-4 w-4"><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="M21 16l-5-5-8 8" /></svg>}
          opsi={[
            { label: sibuk ? "Memproses..." : "Unggah dari perangkat", nonaktif: sibuk, klik: () => berkas.current?.click() },
            { label: "Dari alamat (URL https)", klik: gambarUrl },
            { label: "Dari galeri", klik: () => setGaleri(true) },
          ]}
        />
        <MenuIkon
          tanpaFokus
          judul="Lainnya"
          ikon={<svg {...garis} className="h-4 w-4"><circle cx="5" cy="12" r="1.2" fill="currentColor" /><circle cx="12" cy="12" r="1.2" fill="currentColor" /><circle cx="19" cy="12" r="1.2" fill="currentColor" /></svg>}
          opsi={[
            { label: "Garis pemisah", klik: () => c()?.setHorizontalRule().run() },
            ...(catatanKaki ? [{ label: "Sisipkan catatan kaki", klik: sisipCatatanKaki }] : []),
            { label: "Hapus semua pemformatan", klik: () => c()?.unsetAllMarks().clearNodes().run() },
          ]}
        />
        <Pemisah />
        <Tombol judul="Urungkan (Ctrl+Z)" disabled={!editor?.can().undo()} onClick={() => c()?.undo().run()}>&#8630;</Tombol>
        <Tombol judul="Ulangi (Ctrl+Y)" disabled={!editor?.can().redo()} onClick={() => c()?.redo().run()}>&#8631;</Tombol>
        <AlatBahasa editor={editor} bahasa={bahasa} setBahasa={setBahasa} ejaan={ejaan} setEjaan={setEjaan} />
        <Tombol judul={penuh ? "Keluar dari layar penuh (Esc)" : "Menulis layar penuh"} aktif={penuh} onClick={() => setPenuh((b) => !b)}>
          {penuh
            ? <svg {...garis} className="h-4 w-4"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" /></svg>
            : <svg {...garis} className="h-4 w-4"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>}
        </Tombol>
        <input
          ref={berkas}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) unggah(f); e.target.value = ""; }}
        />
      </div>
      {pesan && <p className="border border-b-0 bg-amber-50 px-3 py-1.5 text-sm text-amber-900" role="status">{pesan}</p>}
      {catatanBaru !== null && (
        <p className="border border-b-0 bg-amber-50 px-3 py-1.5 text-sm text-amber-900" role="status">
          Catatan kaki [{catatanBaru}] disisipkan; nomor catatan lain sudah diurutkan ulang dari atas ke bawah.{" "}
          <button type="button" onClick={lompatCatatan} className="font-semibold underline">Ke catatan [{catatanBaru}]</button>
          <button type="button" onClick={() => setCatatanBaru(null)} className="ml-3 opacity-60">Tutup</button>
        </p>
      )}
      <EditorContent editor={editor} />
      <input type="hidden" name={name} value={html} />
      {galeri && <GaleriGambar tutup={() => setGaleri(false)} pilih={(u) => { setGaleri(false); sisipGambar(u); }} />}
    </div>
  );
}
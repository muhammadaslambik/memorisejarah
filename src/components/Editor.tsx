// PAKET-10A: editor teks (WYSIWYG): yang Anda lihat adalah hasilnya, tanpa kode.
// Pintasan: Ctrl+B tebal, Ctrl+I miring, Ctrl+U garis bawah, Ctrl+K tautan, Ctrl+Z urungkan, Ctrl+Y ulangi.
"use client";
import { useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { ekstensiEditor } from "./editor-ekstensi";
import { unggahGambarArtikel } from "@/lib/unggah-actions";

type Props = { initial: string; name?: string; catatanKaki?: boolean; tinggi?: number };

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

export function Editor({ initial, name = "content", catatanKaki = false, tinggi = 300 }: Props) {
  const [html, setHtml] = useState(initial);
  const [pesan, setPesan] = useState("");
  const berkas = useRef<HTMLInputElement>(null);
  const aksiTautan = useRef<() => void>(() => {});
  const editor = useEditor({
    extensions: ekstensiEditor,
    content: initial,
    immediatelyRender: false,
    onUpdate: ({ editor }) => setHtml(editor.getHTML()),
    editorProps: {
      attributes: { class: "prose prose-stone max-w-none rounded-b-lg border bg-white p-4 text-charcoal focus:outline-none", style: `min-height:${tinggi}px` },
      handleKeyDown: (_v, e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); aksiTautan.current(); return true; }
        return false;
      },
    },
  });
  const c = () => editor?.chain().focus();
  const ya = (nama: string, attrs?: Record<string, unknown>) => !!editor?.isActive(nama, attrs);
  const rata = (a: string) => !!editor?.isActive({ textAlign: a });

  const sisipGambar = (src: string) => {
    const ket = (window.prompt("Keterangan gambar (boleh dikosongkan)") ?? "").trim();
    const isi: object[] = [{ type: "image", attrs: { src, alt: ket } }];
    if (ket) isi.push({ type: "figcaption", content: [{ type: "text", text: ket }] });
    c()?.insertContent({ type: "figure", content: isi }).run();
  };
  const unggah = async (f: File) => {
    setPesan("Mengunggah gambar...");
    const fd = new FormData();
    fd.set("berkas", f);
    const r = await unggahGambarArtikel(fd);
    if ("url" in r) { setPesan(""); sisipGambar(r.url); } else setPesan(r.galat);
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
    const re = /id="_ftn(?:ref)?(\d+)"/g;
    const src = editor.getHTML();
    let n = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(src))) n = Math.max(n, Number(m[1]));
    n += 1;
    editor.chain().focus().insertContent({ type: "text", text: `[${n}]`, marks: [{ type: "link", attrs: { href: `#_ftn${n}`, id: `_ftnref${n}` } }] }).run();
    editor.chain().insertContentAt(editor.state.doc.content.size, {
      type: "paragraph",
      content: [{ type: "text", text: `[${n}]`, marks: [{ type: "link", attrs: { href: `#_ftnref${n}`, id: `_ftn${n}` } }] }, { type: "text", text: " " }],
    }).run();
    setPesan(`Catatan kaki [${n}] disisipkan. Isi teks catatannya pada baris [${n}] di akhir artikel.`);
  };

  const gaya = ya("heading", { level: 2 }) ? "2" : ya("heading", { level: 3 }) ? "3" : ya("heading", { level: 4 }) ? "4" : "p";

  return (
    <div className="editor-kaya">
      <div className="sticky top-14 z-10 flex flex-wrap items-center gap-0.5 rounded-t-lg border border-b-0 bg-cream-dark p-1.5" role="toolbar" aria-label="Pemformatan teks">
        <select
          aria-label="Gaya paragraf"
          value={gaya}
          onChange={(e) => { const v = e.target.value; if (v === "p") c()?.setParagraph().run(); else c()?.setHeading({ level: Number(v) as 2 | 3 | 4 }).run(); }}
          className="mr-1 h-8 rounded-md border border-black/10 bg-white px-2 text-sm"
        >
          <option value="p">Paragraf</option>
          <option value="2">Judul besar</option>
          <option value="3">Judul sedang</option>
          <option value="4">Judul kecil</option>
        </select>
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
        <Tombol judul="Rata kiri (Ctrl+Shift+L)" aktif={rata("left")} onClick={() => c()?.setTextAlign("left").run()}>
          <svg {...garis} className="h-4 w-4"><path d="M4 6h16M4 10h10M4 14h16M4 18h10" /></svg>
        </Tombol>
        <Tombol judul="Rata tengah (Ctrl+Shift+E)" aktif={rata("center")} onClick={() => c()?.setTextAlign("center").run()}>
          <svg {...garis} className="h-4 w-4"><path d="M4 6h16M7 10h10M4 14h16M7 18h10" /></svg>
        </Tombol>
        <Tombol judul="Rata kanan (Ctrl+Shift+R)" aktif={rata("right")} onClick={() => c()?.setTextAlign("right").run()}>
          <svg {...garis} className="h-4 w-4"><path d="M4 6h16M10 10h10M4 14h16M10 18h10" /></svg>
        </Tombol>
        <Tombol judul="Rata kiri-kanan (Ctrl+Shift+J)" aktif={rata("justify")} onClick={() => c()?.setTextAlign("justify").run()}>
          <svg {...garis} className="h-4 w-4"><path d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
        </Tombol>
        <Pemisah />
        <Tombol judul="Tautan (Ctrl+K)" aktif={ya("link")} lebar onClick={() => aksiTautan.current()}>Tautan</Tombol>
        <Tombol judul="Unggah gambar dari perangkat" lebar onClick={() => berkas.current?.click()}>Gambar</Tombol>
        <Tombol judul="Sisipkan gambar dari alamat https" lebar onClick={gambarUrl}>Gambar (URL)</Tombol>
        <Tombol judul="Garis pemisah" lebar onClick={() => c()?.setHorizontalRule().run()}>&mdash;</Tombol>
        {catatanKaki && <Tombol judul="Sisipkan catatan kaki" lebar onClick={sisipCatatanKaki}>Catatan kaki</Tombol>}
        <Pemisah />
        <Tombol judul="Urungkan (Ctrl+Z)" disabled={!editor?.can().undo()} onClick={() => c()?.undo().run()}>&#8630;</Tombol>
        <Tombol judul="Ulangi (Ctrl+Y)" disabled={!editor?.can().redo()} onClick={() => c()?.redo().run()}>&#8631;</Tombol>
        <Tombol judul="Hapus semua pemformatan" lebar onClick={() => c()?.unsetAllMarks().clearNodes().run()}>Bersihkan</Tombol>
        <input
          ref={berkas}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) unggah(f); e.target.value = ""; }}
        />
      </div>
      {pesan && <p className="border border-b-0 bg-amber-50 px-3 py-1.5 text-sm text-amber-900">{pesan}</p>}
      <EditorContent editor={editor} />
      <input type="hidden" name={name} value={html} />
    </div>
  );
}
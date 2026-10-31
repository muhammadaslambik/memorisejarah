// PAKET-6A
"use client";
import { useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { ekstensiEditor } from "./editor-ekstensi";
import { unggahGambarArtikel } from "@/lib/unggah-actions";

// Editor TipTap; isi HTML disalin ke input hidden agar ikut terkirim ke Server Action
export function Editor({ initial }: { initial: string }) {
  const [html, setHtml] = useState(initial);
  const [pesan, setPesan] = useState("");
  const berkas = useRef<HTMLInputElement>(null);
  const editor = useEditor({
    extensions: ekstensiEditor,
    content: initial,
    immediatelyRender: false,
    onUpdate: ({ editor }) => setHtml(editor.getHTML()),
    editorProps: { attributes: { class: "prose prose-stone min-h-[300px] max-w-none rounded-b border bg-white p-4 focus:outline-none" } },
  });
  const btn = (label: string, run: () => void) => (
    <button type="button" onClick={run} className="rounded border bg-white px-3 py-1 text-sm">{label}</button>
  );

  const sisipGambar = (src: string) => {
    const ket = (window.prompt("Keterangan gambar (boleh dikosongkan)") ?? "").trim();
    const isi: object[] = [{ type: "image", attrs: { src, alt: ket } }];
    if (ket) isi.push({ type: "figcaption", content: [{ type: "text", text: ket }] });
    editor?.chain().focus().insertContent({ type: "figure", content: isi }).run();
  };

  const unggah = async (f: File) => {
    setPesan("Mengunggah gambar...");
    const fd = new FormData();
    fd.set("berkas", f);
    const r = await unggahGambarArtikel(fd);
    if ("url" in r) { setPesan(""); sisipGambar(r.url); } else setPesan(r.galat);
  };

  const tautan = () => {
    if (!editor) return;
    const url = window.prompt("Alamat tautan (https://...) - kosongkan untuk menghapus tautan");
    if (url === null) return;
    if (url.trim() === "") editor.chain().focus().unsetLink().run();
    else editor.chain().focus().setLink({ href: url.trim() }).run();
  };

  const gambarUrl = () => {
    const url = window.prompt("Alamat gambar (https://...)");
    if (url && /^https:\/\//i.test(url.trim())) sisipGambar(url.trim());
    else if (url) setPesan("Alamat gambar harus diawali https://");
  };

  const catatanKaki = () => {
    if (!editor) return;
    const re = /id="_ftn(?:ref)?(\d+)"/g;
    const src = editor.getHTML();
    let n = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(src))) n = Math.max(n, Number(m[1]));
    n += 1;
    editor.chain().focus()
      .insertContent({ type: "text", text: `[${n}]`, marks: [{ type: "link", attrs: { href: `#_ftn${n}`, id: `_ftnref${n}` } }] })
      .run();
    editor.chain()
      .insertContentAt(editor.state.doc.content.size, {
        type: "paragraph",
        content: [{ type: "text", text: `[${n}]`, marks: [{ type: "link", attrs: { href: `#_ftnref${n}`, id: `_ftn${n}` } }] }, { type: "text", text: " " }],
      })
      .run();
    setPesan(`Catatan kaki [${n}] disisipkan. Isi teks catatannya pada baris [${n}] di akhir artikel.`);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 rounded-t border border-b-0 bg-cream-dark p-2">
        {btn("B", () => editor?.chain().focus().toggleBold().run())}
        {btn("I", () => editor?.chain().focus().toggleItalic().run())}
        {btn("H2", () => editor?.chain().focus().toggleHeading({ level: 2 }).run())}
        {btn("H3", () => editor?.chain().focus().toggleHeading({ level: 3 }).run())}
        {btn("Daftar", () => editor?.chain().focus().toggleBulletList().run())}
        {btn("1. Daftar", () => editor?.chain().focus().toggleOrderedList().run())}
        {btn("Kutipan", () => editor?.chain().focus().toggleBlockquote().run())}
        {btn("Tautan", tautan)}
        {btn("Gambar (unggah)", () => berkas.current?.click())}
        {btn("Gambar (URL)", gambarUrl)}
        {btn("Catatan kaki", catatanKaki)}
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
      <input type="hidden" name="content" value={html} />
    </div>
  );
}
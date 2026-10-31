# Paket 6A: editor dengan gambar, tautan, catatan kaki + sanitizer WordPress. ASCII saja, idempoten.. ASCII saja, idempoten.
$ErrorActionPreference = 'Stop'
$root = (Get-Location).Path
if (-not [System.IO.File]::Exists([System.IO.Path]::Combine($root,'package.json')) -or -not [System.IO.Directory]::Exists([System.IO.Path]::Combine($root,'src','app','(situs)'))) {
  Write-Host 'Jalankan dari folder proyek memorisejarah (cabang tema-gelap).' -ForegroundColor Red; exit 1
}
$utf8 = New-Object System.Text.UTF8Encoding($false)
function Tulis($bagian, $nama, $isi) {
  $dir = $root
  foreach ($b in $bagian) { $dir = [System.IO.Path]::Combine($dir, $b) }
  $file = [System.IO.Path]::Combine($dir, $nama)
  if ([System.IO.File]::Exists($file)) {
    $lama = [System.IO.File]::ReadAllText($file)
    if (-not ($lama.Contains('PAKET-') -or $lama.Contains('Segera hadir'))) {
      Write-Host ('DILEWATI (berkas buatan Anda, tidak ditimpa): ' + $file) -ForegroundColor Yellow; return
    }
  }
  [System.IO.Directory]::CreateDirectory($dir) | Out-Null
  [System.IO.File]::WriteAllText($file, $isi.Replace("`r`n","`n").Replace("`n","`r`n"), $utf8)
  Write-Host ('Ditulis: ' + $file) -ForegroundColor Green
}





function TulisGanti($bagian, $nama, $isi, $penanda) {
  $dir = $root
  foreach ($b in $bagian) { $dir = [System.IO.Path]::Combine($dir, $b) }
  $file = [System.IO.Path]::Combine($dir, $nama)
  if ([System.IO.File]::Exists($file)) {
    $lama = [System.IO.File]::ReadAllText($file)
    if (-not ($lama.Contains('PAKET-') -or $lama.Contains($penanda))) {
      Write-Host ('DILEWATI (berkas berbeda dari dugaan): ' + $file) -ForegroundColor Yellow; return
    }
  }
  [System.IO.Directory]::CreateDirectory($dir) | Out-Null
  [System.IO.File]::WriteAllText($file, $isi.Replace("`r`n","`n").Replace("`n","`r`n"), $utf8)
  Write-Host ('Ditulis: ' + $file) -ForegroundColor Green
}

Tulis @('src','components') 'editor-ekstensi.ts' @'
// PAKET-6A: ekstensi TipTap bersama (dipakai Editor dan pengujian)
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { Node, mergeAttributes } from "@tiptap/core";

// <figure><img><figcaption>: gambar dengan keterangan (bentuk yang dipakai WordPress)
export const Figure = Node.create({
  name: "figure",
  group: "block",
  content: "image figcaption?",
  draggable: true,
  isolating: true,
  parseHTML() { return [{ tag: "figure" }]; },
  renderHTML({ HTMLAttributes }) { return ["figure", mergeAttributes(HTMLAttributes), 0]; },
});

export const Figcaption = Node.create({
  name: "figcaption",
  content: "inline*",
  defining: true,
  parseHTML() { return [{ tag: "figcaption" }]; },
  renderHTML({ HTMLAttributes }) { return ["figcaption", mergeAttributes(HTMLAttributes), 0]; },
});

// Tautan yang mempertahankan atribut id (jangkar catatan kaki #_ftn1 / #_ftnref1)
export const Tautan = Link.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      id: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute("id"),
        renderHTML: (a: Record<string, unknown>) => (a.id ? { id: a.id } : {}),
      },
    };
  },
}).configure({ openOnClick: false, autolink: false, HTMLAttributes: { target: null, rel: null } });

export const ekstensiEditor = [StarterKit, Image, Figure, Figcaption, Tautan];
'@

Tulis @('src','lib') 'unggah-actions.ts' @'
// PAKET-6A: unggah gambar dari editor artikel (semua pengguna yang masuk)
"use server";
import { requireUser } from "./auth";
import { unggahKeImageKit } from "./gambar-simpan";

export async function unggahGambarArtikel(fd: FormData): Promise<{ url: string } | { galat: string }> {
  await requireUser();
  const f = fd.get("berkas");
  if (!(f instanceof File)) return { galat: "Berkas tidak ditemukan." };
  const h = await unggahKeImageKit(f, "artikel");
  if ("galat" in h) {
    return { galat: h.galat === "belum" ? "Penyimpanan ImageKit belum disiapkan." : h.galat === "berkas" ? "Berkas tidak valid (JPG, PNG, WEBP, GIF; maksimal 10 MB)." : "Unggah gagal. Coba lagi." };
  }
  return { url: h.url };
}
'@

$pen = 'StarterKit'
TulisGanti @('src','components') 'Editor.tsx' @'
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
'@ $pen

$pen = 'whiteList'
TulisGanti @('src','lib') 'sanitize.ts' @'
// PAKET-6A
import { FilterXSS, escapeAttrValue, friendlyAttrValue, safeAttrValue } from "xss";

// Daftar putih: tag yang bisa dihasilkan editor (TipTap) dan yang dibawa artikel WordPress
// (gambar dalam figure, catatan kaki berupa tautan ber-id). Tag lain (script, iframe, style, form, dll.)
// dibuang; script dan style dibuang beserta isinya. Komentar HTML dibuang oleh pustaka xss.
const whiteList: Record<string, string[]> = {
  p: [], br: [], hr: [], h1: [], h2: [], h3: [], h4: [], h5: [], h6: [],
  strong: [], b: [], em: [], i: [], s: [], u: [], sup: [], sub: [], code: ["class"], pre: [], blockquote: [],
  ul: [], ol: [], li: [],
  a: ["href", "title", "id"],
  img: ["src", "alt", "title"],
  figure: [], figcaption: [],
};

const SAFE_URL = /^(https?:\/\/|mailto:|\/(?!\/)|#)/i;
// id hanya untuk jangkar catatan kaki (_ftn1, _ftnref1, fn1, fnref1); id lain dibuang agar tidak menimpa elemen halaman
const SAFE_ID = /^_?(ftn|fn)(ref)?\d{1,4}$/;

const filter = new FilterXSS({
  whiteList,
  stripIgnoreTag: true,
  stripIgnoreTagBody: ["script", "style"],
  safeAttrValue(tag, name, value, css) {
    if (name === "href" || name === "src") {
      const v = friendlyAttrValue(value).trim();
      return SAFE_URL.test(v) ? escapeAttrValue(v) : ""; // tolak javascript:, data:, dll.
    }
    if (name === "id") return SAFE_ID.test(value) ? escapeAttrValue(value) : "";
    if (name === "class") return /^language-[\w-]+$/.test(value) ? escapeAttrValue(value) : "";
    return safeAttrValue(tag, name, value, css);
  },
});

export const sanitizeHtml = (html: string) => filter.process(html);

// URL gambar sampul: hanya http(s)
export const safeCoverUrl = (v: string) => (/^https?:\/\//i.test(v.trim()) ? v.trim() : null);
'@ $pen

function Ganti($f, $lama, $baru, $ket) {
  if (-not [System.IO.File]::Exists($f)) { Write-Host ('Tidak ada: ' + $f) -ForegroundColor Yellow; return }
  $t = [System.IO.File]::ReadAllText($f)
  if ($t.Contains($baru)) { Write-Host ($ket + ': sudah diterapkan (dilewati).') -ForegroundColor Yellow; return }
  if (-not $t.Contains($lama)) { Write-Host ('PERHATIAN ' + $ket + ': teks yang dicari tidak ditemukan, beri tahu saya.') -ForegroundColor Red; return }
  [System.IO.File]::WriteAllText($f, $t.Replace($lama, $baru), $utf8)
  Write-Host ($ket + ': diterapkan.') -ForegroundColor Green
}
function P { $f = $root; foreach ($b in $args) { $f = [System.IO.Path]::Combine($f, $b) }; return $f }



# globals.css: jarak gulir agar tautan #_ftn tidak tertutup header lengket
$gf = P 'src' 'app' 'globals.css'
if ([System.IO.File]::Exists($gf)) {
  $gt = [System.IO.File]::ReadAllText($gf)
  if ($gt.Contains('scroll-padding-top')) { Write-Host 'globals.css: sudah diterapkan (dilewati).' -ForegroundColor Yellow }
  else { [System.IO.File]::WriteAllText($gf, $gt.TrimEnd() + "`r`n`r`nhtml { scroll-padding-top: 6rem; }`r`n", $utf8); Write-Host 'globals.css: diterapkan.' -ForegroundColor Green }
}
# halaman artikel: gambar dan keterangan pada tema gelap
$pf = P 'src' 'app' '(situs)' 'artikel' '[slug]' 'page.tsx'
$po = 'prose-headings:font-serif prose-a:text-ms-gold'
Ganti $pf $po ($po + ' prose-img:rounded-xl prose-figcaption:text-center prose-figcaption:text-ms-cream/60') 'Halaman artikel (gaya gambar)'

Write-Host ''
Write-Host 'Langkah berikutnya (WAJIB, sekali saja):' -ForegroundColor Cyan
Write-Host '  npm install @tiptap/extension-image@2.27.3 @tiptap/extension-link@2.27.3 @tiptap/core@2.27.3' -ForegroundColor Cyan
Write-Host 'Lalu hentikan dan jalankan ulang npm run dev.' -ForegroundColor Cyan

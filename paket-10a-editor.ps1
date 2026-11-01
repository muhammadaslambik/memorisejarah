# Paket 10A: editor teks lengkap (tanpa kode) untuk artikel dan halaman Tentang. ASCII saja, idempoten.. ASCII saja, idempoten.. ASCII saja, idempoten.
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







function Ganti($f, $lama, $baru, $ket) {
  if (-not [System.IO.File]::Exists($f)) { Write-Host ('Tidak ada: ' + $f) -ForegroundColor Yellow; return }
  $t = [System.IO.File]::ReadAllText($f)
  if ($t.Contains($baru)) { Write-Host ($ket + ': sudah diterapkan (dilewati).') -ForegroundColor Yellow; return }
  if (-not $t.Contains($lama)) { Write-Host ('PERHATIAN ' + $ket + ': teks yang dicari tidak ditemukan, beri tahu saya.') -ForegroundColor Red; return }
  [System.IO.File]::WriteAllText($f, $t.Replace($lama, $baru), $utf8)
  Write-Host ($ket + ': diterapkan.') -ForegroundColor Green
}
function P { $f = $root; foreach ($b in $args) { $f = [System.IO.Path]::Combine($f, $b) }; return $f }









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
// PAKET-10A: ekstensi TipTap bersama (dipakai Editor dan pengujian)
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
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

export const ekstensiEditor = [
  StarterKit,
  Underline,
  TextAlign.configure({ types: ["heading", "paragraph"] }),
  Image,
  Figure,
  Figcaption,
  Tautan,
];
'@

Tulis @('src','components') 'Editor.tsx' @'
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
'@

Tulis @('src','lib') 'sanitize.ts' @'
// PAKET-10A
import { FilterXSS, escapeAttrValue, friendlyAttrValue, safeAttrValue } from "xss";

// Daftar putih: tag yang bisa dihasilkan editor (TipTap) dan yang dibawa artikel WordPress
// (gambar dalam figure, catatan kaki berupa tautan ber-id). Tag lain (script, iframe, style, form, dll.)
// dibuang; script dan style dibuang beserta isinya. Komentar HTML dibuang oleh pustaka xss.
const whiteList: Record<string, string[]> = {
  p: ["style"], br: [], hr: [], h1: ["style"], h2: ["style"], h3: ["style"], h4: ["style"], h5: ["style"], h6: ["style"],
  strong: [], b: [], em: [], i: [], s: [], u: [], sup: [], sub: [], code: ["class"], pre: [], blockquote: [],
  ul: [], ol: [], li: [],
  a: ["href", "title", "id"],
  img: ["src", "alt", "title"],
  figure: [], figcaption: [],
};

const SAFE_URL = /^(https?:\/\/|mailto:|\/(?!\/)|#)/i;
// id hanya untuk jangkar catatan kaki (_ftn1, _ftnref1, fn1, fnref1); id lain dibuang agar tidak menimpa elemen halaman
const SAFE_ID = /^_?(ftn|fn)(ref)?\d{1,4}$/;
// style hanya untuk perataan teks yang dihasilkan editor
const SAFE_STYLE = /^text-align:\s*(left|center|right|justify);?\s*$/i;

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
    if (name === "style") return SAFE_STYLE.test(value.trim()) ? value.trim() : "";
    return safeAttrValue(tag, name, value, css);
  },
});

export const sanitizeHtml = (html: string) => filter.process(html);

// URL gambar sampul: hanya http(s)
export const safeCoverUrl = (v: string) => (/^https?:\/\//i.test(v.trim()) ? v.trim() : null);
'@

Tulis @('src','lib') 'teks-ke-html.ts' @'
// PAKET-10A: mengubah teks berformat sederhana (versi lama: ## - 1. > **tebal** [teks](/alamat)) menjadi HTML.
// Dipakai agar teks bawaan dan teks yang dulu disimpan dengan kode tetap tampil benar di editor baru.
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const URL_AMAN = /^(\/(?!\/)|https:\/\/|mailto:)/i;

const sebaris = (s: string) =>
  esc(s)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t: string, u: string) => (URL_AMAN.test(u) ? `<a href="${u}">${t}</a>` : m));

export function markupKeHtml(teks: string): string {
  const blok = teks.replace(/\r\n/g, "\n").split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return blok.map((b) => {
    const baris = b.split("\n");
    if (b.startsWith("## ")) return `<h3>${sebaris(b.slice(3))}</h3>`;
    if (b.startsWith("> ")) return `<blockquote><p>${sebaris(baris.map((l) => l.replace(/^>\s?/, "")).join(" "))}</p></blockquote>`;
    if (baris.every((l) => /^-\s/.test(l))) return `<ul>${baris.map((l) => `<li><p>${sebaris(l.replace(/^-\s/, ""))}</p></li>`).join("")}</ul>`;
    if (baris.every((l) => /^\d+\.\s/.test(l))) return `<ol>${baris.map((l) => `<li><p>${sebaris(l.replace(/^\d+\.\s/, ""))}</p></li>`).join("")}</ol>`;
    return `<p>${sebaris(baris.join(" "))}</p>`;
  }).join("");
}

// Isi yang sudah berupa HTML dipakai apa adanya; selain itu dianggap teks berformat lama
export const jadiHtml = (isi: string) => (/^\s*</.test(isi) ? isi : markupKeHtml(isi));
'@

Tulis @('src','lib') 'tentang.ts' @'
// PAKET-10A: isi halaman Tentang (HTML dari editor). Bawaan di bawah (teks berformat sederhana, diubah otomatis ke HTML); CMS dapat menimpanya.
import { getSetting } from "./pengaturan";
import { jadiHtml } from "./teks-ke-html";

export type BagianTentang = { kunci: string; judul: string; isi: string };

export const TENTANG_DEFAULT: BagianTentang[] = [
  {
    kunci: "",
    judul: "Tentang",
    isi:
      "**Memori Sejarah** merupakan Lembaga Riset Sejarah dan Komunitas Sejarah yang bertujuan untuk Merawat, Menjaga, dan Melestarikan Sejarah. Memori Sejarah berdiri pertama kali pada tanggal 2 November 2023, digagas oleh seorang sejarawan muda alumni Program Studi Sejarah Peradaban Islam, UIN Raden Mas Said Surakarta bernama Muhammad Aslambik.\n\n" +
      "Nama \u201CMemori Sejarah\u201D terdiri dari kata \u2018Memori\u2019 dan \u2018Sejarah\u2019. Kata \u2018Memori\u2019 bermakna \u2018Tempat Mengingat\u2019. Adapun kata \u2018Sejarah\u2019 bermakna suatu kisah nyata yang pernah terjadi di masa lampau.\n\n" +
      "Dalam proses perjalanannya, Memori Sejarah mengalami perkembangan dengan bertambahnya anggota pengelola, muncul nama-nama pengurus baru lainnya seperti Rifky Arya Pramadana, Sigid Nugrohowati, Dewa Alfaquin Faturangga, Iqbal Al Irfan, Fajri Ana Zahrotul Jannah, Amin Nur Huda, Rina Mutoharoh, dan Arya Bagus Nur Ajiyanto.\n\n" +
      "Dengan bertambahnya jumlah anggota pengelola, harapannya ke depan Memori Sejarah dapat berkembang menjadi lebih baik lagi, sehingga dapat mewujudkan nilai-nilai dasar berdirinya, yaitu untuk Merawat, Menjaga, dan Melestarikan Sejarah, khususnya Sejarah Bangsa Indonesia.\n\n" +
      "Memori Sejarah terus berkembang agar menjadi Lembaga Riset Sejarah dan Komunitas Sejarah yang lebih baik dan profesional, serta membuka kesempatan bagi sejarawan-sejarawan lainnya untuk turut bergabung dalam rangka Merawat, Menjaga, dan Melestarikan Sejarah, khususnya Sejarah Bangsa Indonesia.",
  },
  {
    kunci: "",
    judul: "Motivasi",
    isi:
      "Motivasi awal berdirinya Memori Sejarah dilandasi kegelisahan akan potensi musnahnya naskah-naskah kuno sumber primer sejarah, yang terkadang lenyap dimakan rayap, musnah karena usia, atau berbagai sebab lainnya. Naskah-naskah tersebut adalah hal paling mendasar sebagai rujukan utama dalam merawat sejarah itu sendiri.\n\n" +
      "Selain itu, kisah sejarah yang begitu banyak dan luas kerap kali detail kejadiannya luput dari jangkauan historiografi para sejarawan, sehingga suatu tema tertentu terkadang sulit ditafsirkan secara lengkap dan mendalam karena minimnya sumber, baik primer maupun sekunder.\n\n" +
      "Sadar akan hal itu, merawat sejarah memerlukan uluran tangan banyak pihak, khususnya para pemerhati sejarah yang dapat menjelaskan potongan demi potongan suatu kisah sejarah dan mengaitkannya satu sama lain sesuai konteks zamannya.\n\n" +
      "Maka, hasil historiografi dari seorang sejarawan dengan sejarawan lainnya dapat saling melengkapi. Harapannya, sejarah yang begitu luas dapat dijaga dan dirawat dengan baik, mengingat sejarah adalah suatu identitas, termasuk identitas kita sebagai anak bangsa Indonesia.",
  },
  {
    kunci: "",
    judul: "Visi dan Misi",
    isi:
      "## Visi\n\n> \u201CMewujudkan Memori Sejarah menjadi Tempat Mengingat Sejarah dan Wadah untuk Berkarya\u201D\n\n## Misi\n\n" +
      "1. Merawat dan Mendigitalisasikan Sumber Primer Sejarah\n2. Membuat Tulisan dan Video Bertema Sejarah.\n3. Mengadakan Diskusi Bertema Sejarah.\n4. Membangun Komunitas dan Mewadahi Sejarawan untuk Berkarya.",
  },
  {
    kunci: "",
    judul: "Agenda Realisasi",
    isi:
      "Dalam proses realisasinya, Memori Sejarah melakukan berbagai kegiatan untuk merawat sejarah, antara lain:\n\n" +
      "1. Merawat dan Mendigitalisasikan Sumber Primer Sejarah\n2. Membuat Tulisan dan Video Bertema Sejarah.\n3. Mengadakan Diskusi Bertema Sejarah.\n4. Membangun Komunitas dan Mewadahi Sejarawan untuk Berkarya.\n\n" +
      "[Lihat Agenda Kegiatan \u2192](/agenda)",
  },
  {
    kunci: "logo",
    judul: "Makna Logo",
    isi:
      "- **Berbentuk Otak Manusia:** bermakna \u201CTempat Pusat Ingatan\u201D, karena pusat daya ingat manusia ada di dalam otak. Memori Sejarah hadir sebagai Tempat Mengingat Sejarah, sehingga logo otak manusia sangat relevan digunakan sebagai simbol.\n" +
      "- **Warna Hitam:** melambangkan kedalaman dan kebebasan menjelajahi misteri. Warna ini dipilih di luar logo otak untuk menyimbolkan bahwa tempat mengingat harus diletakkan pada pemikiran mendalam yang berfokus pada eksplorasi misteri sejarah masa lampau, sampai ke titik terdalam sekalipun.\n" +
      "- **Warna Merah, Kuning, Hijau, dan Biru:** digunakan pada logo otak sebagai simbol bahwa ingatan tersebut berisi kreativitas dan keluasan ide pembahasan, karena Memori Sejarah membahas berbagai tema sejarah secara luas dan beragam.\n" +
      "- **Warna Putih:** digunakan pada corak berbentuk jaringan, bermakna bahwa Memori Sejarah berusaha terus berkembang dan membangun silaturahmi serta jaringan relasi yang luas dengan cara yang baik, sebagaimana putih yang identik dengan kebaikan.",
  },
];

const valid = (x: unknown): x is BagianTentang =>
  !!x && typeof x === "object" && typeof (x as BagianTentang).judul === "string" && typeof (x as BagianTentang).isi === "string";

export async function getTentang(): Promise<BagianTentang[]> {
  const v = await getSetting<unknown>("tentang", null);
  if (Array.isArray(v)) {
    const b = v.filter(valid).map((x) => ({ kunci: x.kunci === "logo" ? "logo" : "", judul: x.judul, isi: jadiHtml(x.isi) }));
    if (b.length) return b;
  }
  return TENTANG_DEFAULT.map((x) => ({ ...x, isi: jadiHtml(x.isi) }));
}
'@

Tulis @('src','lib') 'situs-actions.ts' @'
// PAKET-10A: aksi server untuk pengaturan situs dan teks Tentang (admin dan editor)
"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireReviewer } from "./auth";
import { sanitizeHtml } from "./sanitize";
import { setSetting } from "./pengaturan";
import { tautanHttps, tautanInstagram } from "./redaksi";
import type { Situs } from "./situs";
import type { BagianTentang } from "./tentang";

const teks = (fd: FormData, k: string, maks: number) => String(fd.get(k) ?? "").trim().slice(0, maks);

export async function saveSitus(fd: FormData) {
  await requireReviewer();
  const instagram = tautanInstagram(teks(fd, "instagram", 200));
  let yt = teks(fd, "youtube", 300);
  if (/^@[\w.-]{2,60}$/.test(yt)) yt = `https://www.youtube.com/${yt}`;
  const youtube = tautanHttps(yt);
  let wa = teks(fd, "whatsapp", 300);
  if (/^[+\d][\d\s-]{7,20}$/.test(wa)) {
    let d = wa.replace(/[^\d]/g, "");
    if (d.startsWith("0")) d = "62" + d.slice(1);
    wa = `https://wa.me/${d}`;
  }
  const whatsapp = tautanHttps(wa);
  const email = teks(fd, "email", 200);
  if (instagram === null || youtube === null || whatsapp === null) redirect("/admin/situs?error=tautan");
  if (email && !/^\S+@\S+\.\S+$/.test(email)) redirect("/admin/situs?error=email");
  const hasil: Situs = {
    instagram, youtube, whatsapp, email,
    sambutan1: teks(fd, "sambutan1", 500),
    sambutan2: teks(fd, "sambutan2", 500),
  };
  await setSetting("situs", hasil);
  revalidatePath("/", "layout");
  redirect("/admin/situs?ok=1");
}

export async function saveTentang(fd: FormData) {
  await requireReviewer();
  const n = Math.min(20, Number(fd.get("jumlah")) || 0);
  const baris: { urutan: number; b: BagianTentang }[] = [];
  for (let i = 0; i < n; i++) {
    const judul = teks(fd, `judul_${i}`, 120);
    const isi = sanitizeHtml(String(fd.get(`isi_${i}`) ?? "").slice(0, 60000)).trim();
    const kosong = isi.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim() === "" && !/<img/i.test(isi);
    if (!judul && kosong) continue;
    const kunci = teks(fd, `kunci_${i}`, 20) === "logo" ? "logo" : "";
    baris.push({ urutan: Number(fd.get(`urutan_${i}`)) || i + 1, b: { kunci, judul: judul || "Bagian", isi } });
  }
  baris.sort((a, b) => a.urutan - b.urutan);
  await setSetting("tentang", baris.slice(0, 12).map((x) => x.b));
  revalidatePath("/tentang");
  redirect("/admin/tentang?ok=1");
}

export async function resetTentang() {
  await requireReviewer();
  await setSetting("tentang", null);
  revalidatePath("/tentang");
  redirect("/admin/tentang?ok=reset");
}
'@

Tulis @('src','app','(situs)','tentang') 'page.tsx' @'
// PAKET-10A: halaman Tentang; isinya dari pengaturan CMS (bawaan: teks WordPress lama)
import Link from "next/link";
import { getTentang } from "@/lib/tentang";
import { sanitizeHtml } from "@/lib/sanitize";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tentang Memori Sejarah" };

const kartu = "rounded-2xl border border-ms-line bg-ms-surface p-6 md:p-8";
const judulKelas = "font-serif text-2xl font-bold text-ms-gold";
const isiKelas = "prose prose-invert max-w-none leading-relaxed prose-headings:font-serif prose-a:text-ms-gold prose-blockquote:border-ms-gold prose-blockquote:font-serif prose-p:my-3";
const Isi = ({ html }: { html: string }) => <div className={isiKelas} dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }} />;

export default async function Tentang() {
  const bagian = await getTentang();
  const logo = bagian.find((b) => b.kunci === "logo");
  const biasa = bagian.filter((b) => b.kunci !== "logo");
  return (
    <div className="-mb-16 min-h-[70vh] bg-ms-bg pb-24 text-ms-cream">
      <section className="mx-auto max-w-[90rem] px-6 pt-12 md:px-10 lg:px-16">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <img src="/brand/logo-memori-sejarah-kecil.png" alt="Logo Memori Sejarah" className="h-24 w-24 rounded-full" />
          <div>
            <h1 className="font-serif text-4xl font-bold md:text-5xl">Tentang Memori Sejarah</h1>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-ms-gold">Tempat Mengingat Sejarah</p>
          </div>
        </div>

        <div className="mt-10 grid items-start gap-6 lg:grid-cols-2">
          {biasa.map((b, i) => (
            <div key={i} className={kartu}>
              <h2 className={`${judulKelas} mb-4`}>{b.judul}</h2>
              <Isi html={b.isi} />
            </div>
          ))}
        </div>

        {logo && (
          <div className={`${kartu} mt-6`}>
            <h2 className={`${judulKelas} mb-4`}>{logo.judul}</h2>
            <div className="grid items-center gap-8 lg:grid-cols-[1.6fr_1fr]">
              <Isi html={logo.isi} />
              <div className="text-center">
                <img src="/brand/logo-memori-sejarah.png" alt="Logo Memori Sejarah" className="mx-auto w-56 max-w-full rounded-full" />
                <p className="mt-3 font-serif text-lg font-bold">Memori Sejarah</p>
                <p className="text-xs uppercase tracking-[0.2em] text-ms-gold">Tempat Mengingat Sejarah</p>
              </div>
            </div>
          </div>
        )}

        <p className="mt-10 text-sm text-ms-cream/70">
          Ingin tahu siapa di balik Memori Sejarah? <Link href="/tentang/redaksi" className="text-ms-gold">Lihat Susunan Redaksi &rarr;</Link>
        </p>
      </section>
    </div>
  );
}
'@

Tulis @('src','app','admin','tentang') 'page.tsx' @'
// PAKET-10A: ubah teks halaman Tentang dengan editor (tanpa kode)
import { requireReviewer } from "@/lib/auth";
import { getTentang } from "@/lib/tentang";
import { resetTentang, saveTentang } from "@/lib/situs-actions";
import { ConfirmButton } from "@/components/ConfirmButton";
import { Editor } from "@/components/Editor";

export const dynamic = "force-dynamic";

export default async function AdminTentang({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  await requireReviewer();
  const { ok } = await searchParams;
  const bagian = await getTentang();
  const baris = [...bagian, { kunci: "", judul: "", isi: "" }]; // satu baris kosong untuk bagian baru
  return (
    <div className="max-w-4xl">
      <h1 className="font-serif text-3xl">Halaman Tentang</h1>
      <p className="mt-1 text-sm text-charcoal/60">Setiap bagian tampil sebagai kartu di halaman Tentang. Tulis dan format teks seperti di Word (Ctrl+B tebal, Ctrl+I miring, Ctrl+U garis bawah). Kosongkan judul dan isi untuk menghapus sebuah bagian; isi baris paling bawah untuk menambah bagian baru.</p>
      {ok === "reset" && <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">Dikembalikan ke teks bawaan.</p>}
      {ok === "1" && <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">Perubahan disimpan.</p>}
      <form action={saveTentang} className="mt-6 space-y-5">
        <input type="hidden" name="jumlah" value={baris.length} />
        {baris.map((b, i) => (
          <fieldset key={i} className="space-y-3 rounded-xl bg-white/70 p-5">
            <legend className="px-1 text-sm font-medium">{i < bagian.length ? `Bagian ${i + 1}` : "Bagian baru (opsional)"}</legend>
            <input type="hidden" name={`kunci_${i}`} value={b.kunci} />
            <div className="flex gap-3">
              <label className="block flex-1 text-sm">Judul
                <input name={`judul_${i}`} defaultValue={b.judul} maxLength={120} className="mt-1 w-full" />
              </label>
              <label className="block w-24 text-sm">Urutan
                <input name={`urutan_${i}`} type="number" defaultValue={i + 1} className="mt-1 w-full" />
              </label>
            </div>
            <div className="text-sm"><p className="mb-1">Isi</p><Editor name={`isi_${i}`} initial={b.isi} tinggi={i < bagian.length ? 220 : 120} /></div>
            {b.kunci === "logo" && <p className="text-xs text-charcoal/55">Bagian ini ditampilkan lebar di bawah kartu lain, dengan gambar logo di sisi kanan.</p>}
          </fieldset>
        ))}
        <div className="flex flex-wrap items-center gap-4">
          <button className="rounded-lg bg-gold px-5 py-2 text-white">Simpan</button>
        </div>
      </form>
      <form action={resetTentang} className="mt-4">
        <ConfirmButton pesan="Kembalikan semua bagian ke teks bawaan? Perubahan Anda akan hilang." label="Kembalikan ke teks bawaan" />
      </form>
    </div>
  );
}
'@

Write-Host ''
Write-Host 'Langkah berikutnya (WAJIB, sekali saja):' -ForegroundColor Cyan
Write-Host '  npm install @tiptap/extension-underline@2.27.3 @tiptap/extension-text-align@2.27.3' -ForegroundColor Cyan
Write-Host 'Lalu hentikan dan jalankan ulang npm run dev.' -ForegroundColor Cyan

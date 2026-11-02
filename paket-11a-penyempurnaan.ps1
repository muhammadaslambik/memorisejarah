# Paket 11A: unggah gambar cepat, catatan kaki, font CMS, tema terang lembut, daftar artikel (per halaman, kembali), hapus anggota khusus admin. ASCII saja, idempoten.. ASCII saja, idempoten.. ASCII saja, idempoten.
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









Tulis @('src','components') 'Editor.tsx' @'
// PAKET-11A: editor teks (WYSIWYG). Gambar dikecilkan di perangkat sebelum diunggah (lebih cepat), keterangan gambar diketik langsung.
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

// Mengecilkan gambar besar di perangkat pengguna (bukan di server): maksimal 2000 px, format WebP. GIF dibiarkan agar tetap bergerak.
async function perkecil(file: File): Promise<File> {
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
const kb = (n: number) => (n > 1_000_000 ? `${(n / 1_000_000).toFixed(1)} MB` : `${Math.round(n / 1000)} KB`);

export function Editor({ initial, name = "content", catatanKaki = false, tinggi = 300 }: Props) {
  const [html, setHtml] = useState(initial);
  const [pesan, setPesan] = useState("");
  const [sibuk, setSibuk] = useState(false);
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

  // Gambar disisipkan dengan kolom keterangan kosong di bawahnya: klik di sana untuk mengetik (kosong = tidak ditampilkan)
  const sisipGambar = (src: string) => {
    c()?.insertContent({ type: "figure", content: [{ type: "image", attrs: { src, alt: "" } }, { type: "figcaption" }] }).run();
  };
  const unggah = async (f: File) => {
    setSibuk(true);
    try {
      setPesan("Mengecilkan gambar...");
      const kecil = await perkecil(f);
      setPesan(`Mengunggah gambar (${kb(kecil.size)})...`);
      const fd = new FormData();
      fd.set("berkas", kecil);
      const r = await unggahGambarArtikel(fd);
      if ("url" in r) { setPesan(""); sisipGambar(r.url); } else setPesan(r.galat);
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
      <div className="sticky top-16 z-10 flex flex-wrap items-center gap-0.5 rounded-t-lg border border-b-0 bg-cream-dark p-1.5" role="toolbar" aria-label="Pemformatan teks">
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
        <Tombol judul="Unggah gambar dari perangkat (otomatis dikecilkan)" lebar disabled={sibuk} onClick={() => berkas.current?.click()}>{sibuk ? "Memproses..." : "Gambar"}</Tombol>
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
      {pesan && <p className="border border-b-0 bg-amber-50 px-3 py-1.5 text-sm text-amber-900" role="status">{pesan}</p>}
      <EditorContent editor={editor} />
      <input type="hidden" name={name} value={html} />
    </div>
  );
}
'@

Tulis @('src','lib') 'gambar-optimal.ts' @'
// PAKET-11A: gambar ImageKit di artikel dimuat dalam ukuran wajar (lebar maksimal 1200 px) dan malas (lazy) di halaman publik
export function optimalkanGambar(html: string): string {
  return html.replace(/<img\b([^>]*?)\ssrc="(https:\/\/ik\.imagekit\.io\/[^"?]+)"([^>]*)>/gi, (_m, a: string, src: string, b: string) => {
    const malas = /\sloading=/.test(a + b) ? "" : ' loading="lazy" decoding="async"';
    return `<img${a} src="${src}?tr=w-1200,q-85"${b}${malas}>`;
  });
}
'@

Tulis @('src','lib') 'pilihan-halaman.ts' @'
// PAKET-11A: daftar pilihan jumlah per halaman (0 = semua)
export const PILIHAN = [10, 15, 20, 25, 30, 35, 40, 45, 50, 75, 100, 0] as const;
'@

Tulis @('src','lib') 'pref-actions.ts' @'
// PAKET-11A: preferensi per akun (jumlah artikel per halaman di CMS)
"use server";
import { redirect } from "next/navigation";
import { db, userPrefs } from "@/db";
import { requireUser } from "./auth";
import { PILIHAN } from "./pilihan-halaman";

export async function simpanPerHalaman(fd: FormData) {
  const me = await requireUser();
  const n = Number(fd.get("per"));
  const nilai = (PILIHAN as readonly number[]).includes(n) ? n : 20;
  try {
    await db().insert(userPrefs).values({ userId: me.id, perHalaman: nilai })
      .onConflictDoUpdate({ target: userPrefs.userId, set: { perHalaman: nilai } });
  } catch { /* tabel belum dibuat: abaikan */ }
  const k = String(fd.get("kembali") ?? "/admin/artikel");
  redirect(k.startsWith("/admin/artikel") && !k.startsWith("//") ? k : "/admin/artikel");
}
'@

Tulis @('src','components','admin') 'PilihPerHalaman.tsx' @'
// PAKET-11A: pilihan jumlah artikel per halaman (tersimpan per akun)
"use client";
import { PILIHAN } from "@/lib/pilihan-halaman";

export function PilihPerHalaman({ nilai, kembali, aksi }: { nilai: number; kembali: string; aksi: (fd: FormData) => void | Promise<void> }) {
  return (
    <form action={aksi} className="flex items-center gap-2 text-sm">
      <input type="hidden" name="kembali" value={kembali} />
      <label htmlFor="per-halaman" className="a-muted whitespace-nowrap">Per halaman</label>
      <select id="per-halaman" name="per" defaultValue={nilai} onChange={(e) => e.currentTarget.form?.requestSubmit()} className="!py-1.5">
        {PILIHAN.map((n) => <option key={n} value={n}>{n === 0 ? "Semua" : n}</option>)}
      </select>
    </form>
  );
}
'@

Tulis @('src','components','admin') 'IngatDaftar.tsx' @'
// PAKET-11A: mengingat posisi daftar artikel (alamat dan gulir) agar tombol Kembali membawa Anda ke tempat semula
"use client";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function IngatDaftar() {
  const path = usePathname();
  const sp = useSearchParams();
  const url = path + (sp.toString() ? `?${sp.toString()}` : "");

  useEffect(() => {
    try {
      const simpan = JSON.parse(sessionStorage.getItem("adm-daftar") ?? "null") as { url: string; y: number; pulihkan?: boolean } | null;
      if (simpan?.pulihkan && simpan.url === url) {
        requestAnimationFrame(() => window.scrollTo(0, simpan.y));
        sessionStorage.setItem("adm-daftar", JSON.stringify({ url, y: simpan.y }));
      } else {
        sessionStorage.setItem("adm-daftar", JSON.stringify({ url, y: 0 }));
      }
    } catch { /* penyimpanan tidak tersedia */ }
    let tunda = 0;
    const gulir = () => {
      window.clearTimeout(tunda);
      tunda = window.setTimeout(() => {
        try { sessionStorage.setItem("adm-daftar", JSON.stringify({ url, y: window.scrollY })); } catch { /* abaikan */ }
      }, 120);
    };
    window.addEventListener("scroll", gulir, { passive: true });
    return () => { window.removeEventListener("scroll", gulir); window.clearTimeout(tunda); };
  }, [url]);

  return null;
}
'@

Tulis @('src','components','admin') 'TombolKembali.tsx' @'
// PAKET-11A: kembali ke daftar artikel seperti sebelumnya (halaman, filter, pencarian, dan posisi gulir)
"use client";
import { useRouter } from "next/navigation";

export function TombolKembali({ label = "Kembali ke daftar artikel" }: { label?: string }) {
  const router = useRouter();
  const kembali = () => {
    let url = "/admin/artikel";
    try {
      const s = JSON.parse(sessionStorage.getItem("adm-daftar") ?? "null") as { url: string; y: number } | null;
      if (s?.url?.startsWith("/admin/artikel")) {
        url = s.url;
        sessionStorage.setItem("adm-daftar", JSON.stringify({ ...s, pulihkan: true }));
      }
    } catch { /* gunakan alamat bawaan */ }
    router.push(url);
  };
  return (
    <button type="button" onClick={kembali} className="a-btn-soft">&larr; {label}</button>
  );
}
'@

Tulis @('src','app','admin','artikel') 'page.tsx' @'
// PAKET-11A: daftar artikel: filter menempel saat digulir, jumlah per halaman per akun, mengingat posisi untuk tombol Kembali
import Link from "next/link";
import { and, count, desc, eq, ilike } from "drizzle-orm";
import { db, posts, users, categories, userPrefs } from "@/db";
import { kolomKartu } from "@/lib/kolom";
import { kecil } from "@/lib/gambar-url";
import { deletePost } from "@/lib/actions";
import { toggleFeatured } from "@/lib/artikel-cepat-actions";
import { canDeletePost, isReviewer, requireUser } from "@/lib/auth";
import { DeleteButton } from "@/components/DeleteButton";
import { IkonAdmin } from "@/components/admin/ikon-admin";
import { PageHeader } from "@/components/admin/PageHeader";
import { PilihPerHalaman } from "@/components/admin/PilihPerHalaman";
import { IngatDaftar } from "@/components/admin/IngatDaftar";
import { simpanPerHalaman } from "@/lib/pref-actions";

export const dynamic = "force-dynamic";
const DASAR = "/admin/artikel";
type Status = "published" | "pending" | "draft";
const LABEL: Record<Status, string> = { published: "Terbit", pending: "Menunggu", draft: "Draft" };
const CHIP: Record<Status, string> = { published: "a-chip-hijau", pending: "a-chip-kuning", draft: "a-chip-abu" };

export default async function DaftarArtikel({ searchParams }: { searchParams: Promise<{ q?: string; s?: string; hal?: string }> }) {
  const me = await requireUser();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 100);
  const status = (["published", "pending", "draft"] as const).find((x) => x === sp.s);
  const hal = Math.max(1, Number(sp.hal) || 1);
  const rev = isReviewer(me.role);

  const milik = me.role === "penulis" ? eq(posts.authorId, me.id) : undefined;
  const cocok = q ? ilike(posts.title, `%${q.replace(/[\\%_]/g, "\\$&")}%`) : undefined;
  const d = db();
  const pref = await d.select({ n: userPrefs.perHalaman }).from(userPrefs).where(eq(userPrefs.userId, me.id)).limit(1).then((r) => r[0]?.n ?? 20).catch(() => 20);
  const perHalaman = pref === 0 ? 5000 : pref;
  const [rows, hitung, kats] = await Promise.all([
    d.select({ post: kolomKartu, author: users.name }).from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .where(and(milik, cocok, status ? eq(posts.status, status) : undefined))
      .orderBy(desc(posts.updatedAt)).limit(perHalaman + 1).offset((hal - 1) * perHalaman),
    d.select({ status: posts.status, n: count() }).from(posts).where(milik).groupBy(posts.status),
    d.select({ id: categories.id, name: categories.name }).from(categories),
  ]);
  const tampil = rows.slice(0, perHalaman);
  const adaLagi = rows.length > perHalaman;
  const nama = new Map(kats.map((k) => [k.id, k.name]));
  const jml = (s: Status) => Number(hitung.find((h) => h.status === s)?.n ?? 0);
  const semua = jml("published") + jml("pending") + jml("draft");

  const href = (o: { s?: string; hal?: number }) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    const s = "s" in o ? o.s : status;
    if (s) p.set("s", s);
    if (o.hal && o.hal > 1) p.set("hal", String(o.hal));
    const str = p.toString();
    return DASAR + (str ? `?${str}` : "");
  };
  const tab: [string, number, string][] = [["Semua", semua, ""], ["Terbit", jml("published"), "published"], ["Menunggu", jml("pending"), "pending"], ["Draft", jml("draft"), "draft"]];
  const kembali = href({ hal });

  return (
    <div>
      <PageHeader
        ikon="artikel"
        judul="Artikel"
        deskripsi="Kelola semua tulisan di situs."
        aksi={<Link href="/admin/artikel/baru" className="a-btn"><IkonAdmin nama="tambah" className="h-4 w-4" /> Artikel Baru</Link>}
      />

      <IngatDaftar />
      <div className="a-sticky">
        <div className="a-card flex flex-wrap items-center justify-between gap-3 p-3 md:px-4">
          <div className="a-tab-baris" role="tablist" aria-label="Filter status">
            {tab.map(([label, jumlah, s]) => (
              <Link key={label} href={href({ s })} className="a-tab" aria-current={(status ?? "") === s ? "page" : undefined}>
                {label} <span className="a-tab-n">{jumlah}</span>
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <PilihPerHalaman nilai={pref} kembali={href({})} aksi={simpanPerHalaman} />
            <form action={DASAR} className="a-search flex w-full sm:w-64">
              <IkonAdmin nama="cari" className="h-4 w-4 opacity-60" />
              {status && <input type="hidden" name="s" value={status} />}
              <input name="q" type="search" defaultValue={q} placeholder="Cari judul artikel..." aria-label="Cari judul" autoComplete="off" />
            </form>
          </div>
        </div>
      </div>

      <div className="a-card mt-3 p-4 md:p-5">
        {tampil.length === 0 ? (
          <p className="a-muted py-12 text-center text-sm">Tidak ada artikel yang cocok.{(q || status) && <> <Link href={DASAR} className="a-link">Reset pencarian</Link></>}</p>
        ) : (
          <ul className="a-daftar mt-3">
            {tampil.map(({ post: p, author }) => (
              <li key={p.id} className="flex items-center gap-3 py-3">
                <Link href={`/admin/artikel/${p.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  {p.coverUrl
                    ? <img src={kecil(p.coverUrl, 140)} alt="" loading="lazy" referrerPolicy="no-referrer" className="h-14 w-20 shrink-0 rounded-lg object-cover" />
                    : <span className="a-ico h-14 w-20 shrink-0 rounded-lg" style={{ ["--c" as string]: "var(--a-accent)" }}><IkonAdmin nama="artikel" /></span>}
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{p.title}</span>
                    <span className="a-muted mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
                      <span className={`a-chip ${CHIP[p.status]}`}>{LABEL[p.status]}</span>
                      {p.categoryId && nama.get(p.categoryId) && <span>{nama.get(p.categoryId)}</span>}
                      {me.role !== "penulis" && author && <span>oleh {author}</span>}
                      <span>{p.updatedAt.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" })}</span>
                      {p.status === "draft" && p.reviewNote && <span className="a-chip a-chip-kuning">ada catatan editor</span>}
                    </span>
                  </span>
                </Link>
                <div className="flex shrink-0 items-center gap-1">
                  {p.status === "published" && <Link href={`/artikel/${p.slug}`} target="_blank" className="a-ikon-btn" title="Lihat di situs" aria-label="Lihat di situs"><IkonAdmin nama="mata" /></Link>}
                  {rev && (
                    <form action={toggleFeatured}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="kembali" value={kembali} />
                      <button title={p.featured ? "Hapus dari Artikel Pilihan" : "Jadikan Artikel Pilihan"} aria-label="Artikel Pilihan" className={`a-ikon-btn ${p.featured ? "a-bintang-aktif" : ""}`}>
                        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill={p.featured ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden="true"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" /></svg>
                      </button>
                    </form>
                  )}
                  {canDeletePost(me, p) && (
                    <form action={deletePost}>
                      <input type="hidden" name="id" value={p.id} />
                      <DeleteButton title={p.title} />
                    </form>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {(hal > 1 || adaLagi) && (
          <div className="mt-4 flex items-center justify-between border-t border-[var(--a-line)] pt-4 text-sm">
            {hal > 1 ? <Link href={href({ hal: hal - 1 })} className="a-btn-soft">&larr; Sebelumnya</Link> : <span />}
            <span className="a-muted">Halaman {hal}</span>
            {adaLagi ? <Link href={href({ hal: hal + 1 })} className="a-btn-soft">Berikutnya &rarr;</Link> : <span />}
          </div>
        )}
      </div>
    </div>
  );
}
'@

Tulis @('scripts') 'buat-tabel-pref.ts' @'
// PAKET-11A: membuat tabel preferensi per akun. Aman dijalankan ulang.
// Jalankan: npx tsx --env-file=.env.local scripts\buat-tabel-pref.ts
import { neon } from "@neondatabase/serverless";

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL belum terisi di .env.local");
  const sql = neon(process.env.DATABASE_URL);
  await sql`
    CREATE TABLE IF NOT EXISTS user_prefs (
      user_id integer PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      per_halaman integer NOT NULL DEFAULT 20
    )`;
  console.log("Tabel user_prefs siap.");
}
main().catch((e) => { console.error(e); process.exit(1); });
'@

function GantiRegex2($f, $pola, $ganti, $ket) {
  if (-not [System.IO.File]::Exists($f)) { Write-Host ('Tidak ada: ' + $f) -ForegroundColor Yellow; return }
  $t = [System.IO.File]::ReadAllText($f)
  $rx = New-Object System.Text.RegularExpressions.Regex($pola, [System.Text.RegularExpressions.RegexOptions]::Singleline)
  if ($rx.IsMatch($t)) {
    [System.IO.File]::WriteAllText($f, $rx.Replace($t, $ganti, 1), $utf8)
    Write-Host ($ket + ': diterapkan.') -ForegroundColor Green
  } else { Write-Host ($ket + ': tidak ditemukan atau sudah diterapkan (dilewati).') -ForegroundColor Yellow }
}

# 1. schema.ts: tabel preferensi per akun
$sf = P 'src' 'db' 'schema.ts'
$st = [System.IO.File]::ReadAllText($sf)
if ($st.Contains('userPrefs')) { Write-Host 'schema.ts: userPrefs sudah ada (dilewati).' -ForegroundColor Yellow }
else {
  $tambah = @'
// Preferensi per akun (jumlah artikel per halaman di CMS; 0 = semua)
export const userPrefs = pgTable("user_prefs", {
  userId: integer("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  perHalaman: integer("per_halaman").default(20).notNull(),
});
'@
  $st = $st.TrimEnd() + "`r`n`r`n" + $tambah.Replace("`r`n","`n").Replace("`n","`r`n") + "`r`n"
  [System.IO.File]::WriteAllText($sf, $st, $utf8)
  Write-Host 'schema.ts: tabel userPrefs ditambahkan.' -ForegroundColor Green
}

# 2. CSS: ganti tema CMS lama dengan versi baru (terang lebih lembut, font, bilah menempel)
$gf = P 'src' 'app' 'globals.css'
$gt = [System.IO.File]::ReadAllText($gf)
if ($gt.Contains('PAKET-11A: tema CMS')) { Write-Host 'globals.css: tema sudah versi baru (dilewati).' -ForegroundColor Yellow }
else {
  $i = $gt.IndexOf('/* PAKET-10B: tema CMS')
  if ($i -lt 0) { $i = $gt.IndexOf('/* PAKET-9D: tampilan CMS') }
  if ($i -ge 0) { $dasar = $gt.Substring(0, $i).TrimEnd() } else { $dasar = $gt.TrimEnd() }
  $css = @'
/* PAKET-11A: tema CMS coklat (gelap/terang, terang dibuat lebih lembut). Hanya berlaku di dalam .adm */
@layer components {
  .adm {
    --a-bg: #e7ddcd; --a-card: #f4ede1; --a-card2: #ece2d1; --a-line: rgb(74 48 22 / 0.15);
    --a-text: #2a1b0f; --a-muted: #735f4a; --a-accent: #99691b; --a-accent2: #7a5212; --a-input: #f8f3ea;
    --a-shadow: 0 1px 2px rgb(60 36 12 / 0.07), 0 10px 28px -14px rgb(60 36 12 / 0.28);
    background: var(--a-bg); color: var(--a-text); color-scheme: light;
    font-family: var(--font-cms), var(--font-sans), system-ui, sans-serif;
  }
  .adm.tema-gelap {
    --a-bg: #15100b; --a-card: #1f1710; --a-card2: #2a1e14; --a-line: rgb(255 228 184 / 0.09);
    --a-text: #f2e7d5; --a-muted: #a99a85; --a-accent: #dcab4f; --a-accent2: #b98a35; --a-input: #17100a;
    --a-shadow: 0 1px 2px rgb(0 0 0 / 0.4), 0 12px 32px -16px rgb(0 0 0 / 0.65);
    color-scheme: dark;
  }
  body:has(.adm.tema-gelap) { background: #15100b; }
  body:has(.adm.tema-terang) { background: #e7ddcd; }

  /* Bingkai */
  .adm .a-side { background: linear-gradient(180deg, #27180d 0%, #170e07 100%); color: #ecdcc4; border-right: 1px solid rgb(255 228 184 / 0.06); }
  .adm .a-scroll { scrollbar-width: thin; scrollbar-color: rgb(255 228 184 / 0.2) transparent; }
  .adm .a-scrim { position: fixed; inset: 0; z-index: 35; background: rgb(0 0 0 / 0.55); opacity: 0; pointer-events: none; transition: opacity 0.2s; }
  @media (min-width: 1024px) { .adm .a-scrim { display: none; } }
  .adm .a-nav-judul { font-size: 0.65rem; letter-spacing: 0.16em; text-transform: uppercase; color: #8f7b5f; padding: 0 0.75rem 0.35rem; font-weight: 600; }
  .adm .a-nav { display: flex; align-items: center; gap: 0.75rem; padding: 0.55rem 0.75rem; border-radius: 0.75rem; font-size: 0.875rem; color: #cdb99b; transition: background-color 0.15s, color 0.15s, transform 0.15s; }
  .adm a.a-nav:hover { background: rgb(255 228 184 / 0.08); color: #f6ead6; }
  .adm .a-nav[aria-current="page"] { background: linear-gradient(135deg, #e0ae52, #b97b1f); color: #1b1108; font-weight: 600; box-shadow: 0 8px 20px -10px rgb(224 174 82 / 0.8); }
  .adm .a-badge { background: #e11d48; color: #fff; font-size: 0.68rem; font-weight: 700; border-radius: 999px; padding: 0.05rem 0.45rem; }
  .adm .a-nav[aria-current="page"] .a-badge { background: #1b1108; color: #f3e3c3; }
  .adm .a-top { background: color-mix(in srgb, var(--a-bg) 88%, transparent); backdrop-filter: blur(10px); border-bottom: 1px solid var(--a-line); }
  .adm .a-search { align-items: center; gap: 0.5rem; background: var(--a-card); border: 1px solid var(--a-line); border-radius: 999px; padding: 0 0.9rem; max-width: 26rem; transition: box-shadow 0.15s, border-color 0.15s; }
  .adm .a-search:focus-within { border-color: var(--a-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--a-accent) 22%, transparent); }
  .adm .a-search input { flex: 1; min-width: 0; background: transparent !important; border: 0 !important; box-shadow: none !important; padding: 0.55rem 0 !important; outline: none; font-size: 0.875rem; }
  .adm .a-ikon-btn { display: inline-grid; place-items: center; width: 2.4rem; height: 2.4rem; border-radius: 999px; color: var(--a-text); background: transparent; border: 0; transition: background-color 0.15s, color 0.15s, transform 0.15s; cursor: pointer; }
  .adm .a-ikon-btn:hover { background: color-mix(in srgb, var(--a-text) 9%, transparent); color: var(--a-accent); }
  .adm .a-ikon-btn[aria-label^="Menu akun"] { display: inline-flex; align-items: center; }
  .adm .a-bintang-aktif { color: var(--a-accent); }
  .adm .a-ikon-matahari { display: none; }
  .adm.tema-gelap .a-ikon-matahari { display: block; }
  .adm.tema-gelap .a-ikon-bulan { display: none; }
  .adm .a-menu[open] > summary { background: color-mix(in srgb, var(--a-text) 9%, transparent); }
  .adm .a-menu-item { display: block; border-radius: 0.6rem; padding: 0.5rem 0.75rem; font-size: 0.875rem; }
  .adm .a-menu-item:hover { background: color-mix(in srgb, var(--a-text) 9%, transparent); }

  /* Komponen */
  .adm .a-card { background: var(--a-card); border: 1px solid var(--a-line); border-radius: 1.1rem; box-shadow: var(--a-shadow); }
  .adm .a-card-hover { transition: transform 0.18s, box-shadow 0.18s, border-color 0.18s; }
  .adm .a-card-hover:hover { transform: translateY(-3px); border-color: color-mix(in srgb, var(--a-accent) 45%, var(--a-line)); }
  .adm .a-muted { color: var(--a-muted); }
  .adm .a-link { color: var(--a-accent); font-weight: 500; }
  .adm .a-link:hover { text-decoration: underline; text-underline-offset: 3px; }
  .adm .a-ico { display: inline-grid; place-items: center; background: color-mix(in srgb, var(--c, var(--a-accent)) 17%, transparent); color: var(--c, var(--a-accent)); }
  .adm .a-btn { display: inline-flex; align-items: center; gap: 0.45rem; border-radius: 0.8rem; padding: 0.6rem 1.05rem; font-size: 0.875rem; font-weight: 600; color: #1b1108; background: linear-gradient(135deg, #e6b45a, #c48a2a); box-shadow: 0 8px 20px -10px rgb(201 146 47 / 0.9); transition: transform 0.15s, filter 0.15s; }
  .adm .a-btn:hover { filter: brightness(1.06); transform: translateY(-1px); }
  .adm .a-btn-soft { display: inline-flex; align-items: center; gap: 0.4rem; border: 1px solid var(--a-line); border-radius: 0.8rem; padding: 0.5rem 0.9rem; font-size: 0.85rem; background: var(--a-card); transition: border-color 0.15s, color 0.15s; }
  .adm .a-btn-soft:hover { border-color: var(--a-accent); color: var(--a-accent); }
  .adm .a-chip { display: inline-block; border-radius: 999px; padding: 0.1rem 0.6rem; font-size: 0.7rem; font-weight: 600; }
  .adm .a-chip-hijau { background: rgb(34 197 94 / 0.15); color: #15803d; }
  .adm .a-chip-kuning { background: rgb(245 158 11 / 0.17); color: #b45309; }
  .adm .a-chip-abu { background: color-mix(in srgb, var(--a-text) 10%, transparent); color: var(--a-muted); }
  .adm.tema-gelap .a-chip-hijau { color: #86efac; }
  .adm.tema-gelap .a-chip-kuning { color: #fcd34d; }
  .adm .a-daftar > li + li { border-top: 1px solid var(--a-line); }
  .adm .a-daftar > li { transition: background-color 0.15s; }
  .adm .a-aksi { display: flex; align-items: center; gap: 0.7rem; border: 1px solid var(--a-line); border-radius: 0.8rem; padding: 0.65rem 0.85rem; font-size: 0.875rem; background: var(--a-card2); transition: border-color 0.15s, transform 0.15s; }
  .adm .a-aksi:hover { border-color: var(--a-accent); transform: translateX(2px); }
  .adm .a-bar { height: 0.45rem; border-radius: 999px; background: color-mix(in srgb, var(--a-text) 9%, transparent); overflow: hidden; }
  .adm .a-bar > span { display: block; height: 100%; border-radius: 999px; background: linear-gradient(90deg, var(--a-accent2), var(--a-accent)); }
  .adm .a-tab-baris { display: inline-flex; gap: 0.25rem; padding: 0.25rem; border-radius: 0.9rem; background: var(--a-card2); border: 1px solid var(--a-line); }
  .adm .a-tab { display: inline-flex; align-items: center; gap: 0.4rem; border-radius: 0.65rem; padding: 0.4rem 0.8rem; font-size: 0.85rem; color: var(--a-muted); transition: background-color 0.15s, color 0.15s; }
  .adm .a-tab:hover { color: var(--a-text); }
  .adm .a-tab[aria-current="page"] { background: var(--a-card); color: var(--a-text); font-weight: 600; box-shadow: var(--a-shadow); }
  .adm .a-tab-n { font-size: 0.7rem; border-radius: 999px; padding: 0 0.4rem; background: color-mix(in srgb, var(--a-accent) 20%, transparent); color: var(--a-accent); }

  /* Menyesuaikan kelas Tailwind yang dipakai halaman CMS lama ke tema */
  .adm .text-charcoal { color: var(--a-text); }
  .adm .text-charcoal\/80, .adm .text-charcoal\/75 { color: color-mix(in srgb, var(--a-text) 85%, transparent); }
  .adm .text-charcoal\/60, .adm .text-charcoal\/55, .adm .text-charcoal\/50 { color: var(--a-muted); }
  .adm .text-charcoal\/45, .adm .text-charcoal\/35, .adm .text-charcoal\/25 { color: color-mix(in srgb, var(--a-muted) 70%, transparent); }
  .adm main .bg-white\/70 { background: var(--a-card); border: 1px solid var(--a-line); border-radius: 1.1rem; box-shadow: var(--a-shadow); }
  .adm .bg-white\/60 { background: var(--a-card); }
  .adm .bg-cream-dark { background: var(--a-card2); }
  .adm .bg-cream { background: var(--a-bg); }
  .adm .bg-black\/10 { background: color-mix(in srgb, var(--a-text) 12%, transparent); }
  .adm .border, .adm .border-cream-dark { border-color: var(--a-line); }
  .adm .divide-cream-dark > :not([hidden]) ~ :not([hidden]) { border-color: var(--a-line); }
  .adm main .bg-gold { background-image: linear-gradient(135deg, #e6b45a, #c48a2a); color: #1b1108; font-weight: 600; border-radius: 0.8rem; }
  .adm main .bg-gold.text-white { color: #1b1108; }
  .adm main .bg-charcoal { background: var(--a-text); }
  .adm main .bg-charcoal.text-cream { color: var(--a-bg); }
  .adm .text-gold-dark, .adm .hover\:text-gold-dark:hover { color: var(--a-accent); }
  .adm .ring-gold { --tw-ring-color: var(--a-accent); }
  .adm.tema-gelap .bg-green-50, .adm.tema-gelap .bg-green-100 { background: rgb(34 197 94 / 0.14); }
  .adm.tema-gelap .text-green-800 { color: #86efac; }
  .adm.tema-gelap .bg-red-50, .adm.tema-gelap .bg-red-100 { background: rgb(239 68 68 / 0.14); }
  .adm.tema-gelap .text-red-700 { color: #fca5a5; }
  .adm.tema-gelap .bg-amber-50, .adm.tema-gelap .bg-amber-100 { background: rgb(245 158 11 / 0.14); }
  .adm.tema-gelap .text-amber-800, .adm.tema-gelap .text-amber-900 { color: #fcd34d; }
  .adm.tema-gelap .border-amber-300 { border-color: rgb(245 158 11 / 0.4); }
  .adm.tema-gelap .bg-stone-200 { background: rgb(255 255 255 / 0.1); }
  .adm.tema-gelap .text-stone-700 { color: var(--a-muted); }

  /* Isian formulir */
  .adm main input:not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="hidden"]),
  .adm main select, .adm main textarea {
    background: var(--a-input); color: var(--a-text); border: 1px solid var(--a-line); border-radius: 0.7rem;
    padding: 0.55rem 0.8rem; font-size: 0.875rem; outline: none; transition: border-color 0.15s, box-shadow 0.15s;
  }
  .adm main input:not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="hidden"]):focus,
  .adm main select:focus, .adm main textarea:focus {
    border-color: var(--a-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--a-accent) 24%, transparent);
  }
  .adm main ::placeholder { color: color-mix(in srgb, var(--a-muted) 75%, transparent); }
  .adm main input[type="file"] { font-size: 0.85rem; }
  .adm main input[type="checkbox"], .adm main input[type="radio"] { accent-color: var(--a-accent); }
  .adm main fieldset { border-color: var(--a-line); border-radius: 1rem; }
  .adm main legend { font-weight: 600; }
  .adm main h1 { letter-spacing: -0.01em; }
  .adm main button, .adm main a { transition: color 0.15s, background-color 0.15s, border-color 0.15s, box-shadow 0.15s, filter 0.15s; }
  .adm main details > summary { cursor: pointer; }

  /* Editor teks */
  .adm .editor-kaya select { padding: 0 0.5rem; border-radius: 0.5rem; height: 2rem; }
  .adm .editor-kaya .ProseMirror { background: var(--a-input); color: var(--a-text); border-color: var(--a-line); }
  .adm .editor-kaya .prose {
    --tw-prose-body: var(--a-text); --tw-prose-headings: var(--a-text); --tw-prose-bold: var(--a-text);
    --tw-prose-links: var(--a-accent); --tw-prose-quotes: var(--a-text); --tw-prose-quote-borders: var(--a-accent);
    --tw-prose-bullets: var(--a-muted); --tw-prose-counters: var(--a-muted); --tw-prose-hr: var(--a-line); --tw-prose-captions: var(--a-muted);
  }

  /* Bilah filter yang menempel di bawah bilah atas saat halaman digulir */
  .adm .a-sticky { position: sticky; top: 4rem; z-index: 20; margin: 0 -1rem; padding: 0.6rem 1rem; background: color-mix(in srgb, var(--a-bg) 90%, transparent); backdrop-filter: blur(8px); }
  @media (min-width: 1024px) { .adm .a-sticky { margin: 0 -2rem; padding: 0.6rem 2rem; } }

  /* Gambar dan keterangannya di editor */
  .adm .editor-kaya figure { margin: 1.25rem 0; }
  .adm .editor-kaya figure img { max-width: 100%; height: auto; border-radius: 0.75rem; }
  .adm .editor-kaya figcaption { text-align: center; font-size: 0.85rem; color: var(--a-muted); }
  .adm .editor-kaya figcaption:has(> br.ProseMirror-trailingBreak:only-child)::before { content: "Tulis keterangan gambar (boleh dikosongkan)"; font-style: italic; opacity: 0.7; position: absolute; }
}
'@
  [System.IO.File]::WriteAllText($gf, $dasar + "`r`n" + $css.Replace("`r`n","`n").Replace("`n","`r`n") + "`r`n", $utf8)
  Write-Host 'globals.css: tema CMS versi baru diterapkan.' -ForegroundColor Green
}

# 3. sanitizer: buang keterangan gambar yang kosong
Ganti (P 'src' 'lib' 'sanitize.ts') 'export const sanitizeHtml = (html: string) => filter.process(html);' 'export const sanitizeHtml = (html: string) => filter.process(html).replace(/<figcaption>(?:\s|<br\s*\/?>|&nbsp;)*<\/figcaption>/gi, "");' 'Sanitizer (keterangan gambar kosong)'

# 4. halaman artikel publik: gambar ImageKit dimuat dalam ukuran wajar
$pa = P 'src' 'app' '(situs)' 'artikel' '[slug]' 'page.tsx'
Ganti $pa '__html: sanitizeHtml(p.content)' '__html: optimalkanGambar(sanitizeHtml(p.content))' 'Artikel publik (gambar ringan)'
GantiRegex2 $pa '(import \{ sanitizeHtml \}[^\r\n]*;)(?![\s\S]*gambar-optimal)' ('$1' + "`r`n" + 'import { optimalkanGambar } from "@/lib/gambar-optimal";') 'Artikel publik (impor)'

# 5. editor artikel: tombol Kembali dan tombol Catatan kaki
$ep = P 'src' 'app' 'admin' 'artikel' '[id]' 'page.tsx'
Ganti $ep 'import { Editor } from "@/components/Editor";' ('import { Editor } from "@/components/Editor";' + "`r`n" + 'import { TombolKembali } from "@/components/admin/TombolKembali";') 'Editor artikel (impor)'
Ganti $ep '<Editor initial={p?.content ?? ""} />' '<Editor initial={p?.content ?? ""} catatanKaki />' 'Editor artikel (tombol catatan kaki)'
Ganti $ep '<h1 className="font-serif text-3xl">{isNew ? "Artikel Baru" : "Edit Artikel"}</h1>' ('<div className="mb-3"><TombolKembali /></div>' + "`r`n" + '      <h1 className="font-serif text-3xl">{isNew ? "Artikel Baru" : "Edit Artikel"}</h1>') 'Editor artikel (tombol Kembali)'

# 6. hapus anggota redaksi: hanya admin
$ra = P 'src' 'lib' 'redaksi-actions.ts'
Ganti $ra 'import { requireReviewer } from "./auth";' 'import { requireAdmin, requireReviewer } from "./auth";' 'Redaksi (impor requireAdmin)'
GantiRegex2 $ra '(export async function deleteRedaksi\(fd: FormData\) \{\r?\n  await )requireReviewer\(\)' '${1}requireAdmin()' 'Redaksi (hapus hanya admin, sisi server)'
$rp = P 'src' 'app' 'admin' 'redaksi' 'page.tsx'
Ganti $rp '  await requireReviewer();' '  const me = await requireReviewer();' 'Halaman redaksi (peran pengguna)'
$tr = [System.IO.File]::ReadAllText($rp)
if (-not $tr.Contains('me.role === "admin" &&')) {
  GantiRegex2 $rp '(<form action=\{deleteRedaksi\}>.*?</form>)' '{me.role === "admin" && ($1)}' 'Halaman redaksi (tombol hapus hanya admin)'
}

# 7. font CMS
$lf = P 'src' 'app' 'admin' 'layout.tsx'
Ganti $lf 'import { cookies } from "next/headers";' ('import { cookies } from "next/headers";' + "`r`n" + 'import { Manrope } from "next/font/google";') 'Layout CMS (impor font)'
Ganti $lf 'const hitungMenunggu = async () => {' ('const cms = Manrope({ subsets: ["latin"], variable: "--font-cms" });' + "`r`n`r`n" + 'const hitungMenunggu = async () => {') 'Layout CMS (font)'
Ganti $lf '<div className={`adm ${tema} min-h-screen`}>' '<div className={`adm ${cms.variable} ${tema} min-h-screen`}>' 'Layout CMS (pakai font)'

Write-Host ''
Write-Host 'Langkah berikutnya (WAJIB, sekali saja):' -ForegroundColor Cyan
Write-Host '  npx tsx --env-file=.env.local scripts\buat-tabel-pref.ts' -ForegroundColor Cyan
Write-Host 'Lalu muat ulang halaman (Ctrl+F5).' -ForegroundColor Cyan

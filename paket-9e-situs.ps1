# Paket 9E: pengaturan situs, footer baru, halaman Tentang dari CMS. ASCII saja, idempoten.. ASCII saja, idempoten.. ASCII saja, idempoten.
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

Tulis @('src','lib') 'situs.ts' @'
// PAKET-9E: pengaturan umum situs (tautan sosial, kontak, teks sambutan footer)
import { getSetting } from "./pengaturan";

export type Situs = { instagram: string; youtube: string; whatsapp: string; email: string; sambutan1: string; sambutan2: string };

export const SITUS_DEFAULT: Situs = {
  instagram: "https://www.instagram.com/memori_sejarah",
  youtube: "https://www.youtube.com/@Memori_Sejarah",
  whatsapp: "",
  email: "admin@memorisejarah.eu.org",
  sambutan1: "Selamat datang di Memori Sejarah. Situs ini berisi karya historiografi dan kumpulan data sumber primer sejarah.",
  sambutan2: "Kami percaya sejarah bukan hanya hafalan tanggal, melainkan dialog kritis antara masa lalu dan masa kini untuk masa depan yang lebih adil.",
};

// Nilai yang pernah disimpan dari CMS menimpa bawaan, termasuk yang dikosongkan (kosong = disembunyikan)
export async function getSitus(): Promise<Situs> {
  const tersimpan = await getSetting<Partial<Situs>>("situs", {});
  return { ...SITUS_DEFAULT, ...tersimpan };
}
'@

Tulis @('src','lib') 'situs-actions.ts' @'
// PAKET-9E: aksi server untuk pengaturan situs dan teks Tentang (admin dan editor)
"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireReviewer } from "./auth";
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
    const isi = teks(fd, `isi_${i}`, 8000);
    if (!judul && !isi) continue;
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

Tulis @('src','lib') 'tentang.ts' @'
// PAKET-9E: isi halaman Tentang. Bawaan di bawah; CMS (/admin/tentang) dapat menimpanya.
import { getSetting } from "./pengaturan";

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
    const b = v.filter(valid).map((x) => ({ kunci: x.kunci === "logo" ? "logo" : "", judul: x.judul, isi: x.isi }));
    if (b.length) return b;
  }
  return TENTANG_DEFAULT;
}
'@

Tulis @('src','components','content') 'TeksKaya.tsx' @'
// PAKET-9E: teks sederhana dari CMS. Paragraf dipisah baris kosong; "## " subjudul, "- " daftar, "1. " daftar bernomor,
// "> " kutipan, **tebal**, [teks](/alamat). Dirender sebagai elemen React (bukan HTML mentah), jadi aman.
import Link from "next/link";
import type { ReactNode } from "react";

const URL_AMAN = /^(\/(?!\/)|https:\/\/|mailto:)/i;
const kelasTautan = "text-ms-gold underline-offset-4 hover:underline";

function sebaris(s: string, kunci: string): ReactNode[] {
  return s.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)\s]+\))/g).map((p, i) => {
    const k = `${kunci}-${i}`;
    if (p.length > 4 && p.startsWith("**") && p.endsWith("**")) return <strong key={k} className="text-ms-cream">{p.slice(2, -2)}</strong>;
    const m = p.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
    if (m && URL_AMAN.test(m[2])) {
      return m[2].startsWith("/")
        ? <Link key={k} href={m[2]} className={kelasTautan}>{m[1]}</Link>
        : <a key={k} href={m[2]} target="_blank" rel="noopener noreferrer" className={kelasTautan}>{m[1]}</a>;
    }
    return p;
  });
}

export function TeksKaya({ teks }: { teks: string }) {
  const blok = teks.replace(/\r\n/g, "\n").split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="space-y-4 leading-relaxed text-ms-cream/80">
      {blok.map((b, i) => {
        const baris = b.split("\n");
        if (b.startsWith("## ")) return <h3 key={i} className="pt-2 font-serif text-lg font-bold text-ms-cream">{sebaris(b.slice(3), `h${i}`)}</h3>;
        if (b.startsWith("> ")) return <blockquote key={i} className="border-l-2 border-ms-gold pl-4 font-serif text-xl leading-snug text-ms-cream">{sebaris(baris.map((l) => l.replace(/^>\s?/, "")).join(" "), `q${i}`)}</blockquote>;
        if (baris.every((l) => /^-\s/.test(l))) return <ul key={i} className="list-disc space-y-3 pl-5">{baris.map((l, j) => <li key={j}>{sebaris(l.replace(/^-\s/, ""), `u${i}-${j}`)}</li>)}</ul>;
        if (baris.every((l) => /^\d+\.\s/.test(l))) return <ol key={i} className="list-decimal space-y-2 pl-5">{baris.map((l, j) => <li key={j}>{sebaris(l.replace(/^\d+\.\s/, ""), `o${i}-${j}`)}</li>)}</ol>;
        return <p key={i}>{sebaris(baris.join(" "), `p${i}`)}</p>;
      })}
    </div>
  );
}
'@

Tulis @('src','app','admin','situs') 'page.tsx' @'
// PAKET-9E: pengaturan umum situs (tautan sosial, kontak, teks sambutan footer)
import { requireReviewer } from "@/lib/auth";
import { getSitus } from "@/lib/situs";
import { saveSitus } from "@/lib/situs-actions";

export const dynamic = "force-dynamic";
const errors: Record<string, string> = {
  tautan: "Tautan harus berupa alamat https yang valid (Instagram boleh @nama; YouTube boleh @nama; WhatsApp boleh nomor).",
  email: "Format email tidak valid.",
};

export default async function AdminSitus({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  await requireReviewer();
  const { ok, error } = await searchParams;
  const s = await getSitus();
  const input = "mt-1 w-full";
  return (
    <div className="max-w-3xl">
      <h1 className="font-serif text-3xl">Pengaturan Situs</h1>
      <p className="mt-1 text-sm text-charcoal/60">Tautan sosial dan kontak di footer dan tombol Hubungi Kami. Kosongkan sebuah kolom untuk menyembunyikannya dari situs.</p>
      {ok && <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">Perubahan disimpan.</p>}
      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{errors[error] ?? "Terjadi kesalahan."}</p>}
      <form action={saveSitus} className="mt-6 space-y-5">
        <fieldset className="space-y-3 rounded-xl bg-white/70 p-5">
          <legend className="px-1 text-sm font-medium">Sosial media dan kontak</legend>
          <label className="block text-sm">Instagram (@nama atau tautan)
            <input name="instagram" defaultValue={s.instagram} maxLength={200} className={input} />
          </label>
          <label className="block text-sm">YouTube (@nama atau tautan kanal)
            <input name="youtube" defaultValue={s.youtube} maxLength={300} className={input} />
          </label>
          <label className="block text-sm">WhatsApp (tautan grup atau saluran, atau nomor)
            <input name="whatsapp" defaultValue={s.whatsapp} maxLength={300} placeholder="https://chat.whatsapp.com/... atau 0812xxxxxxx" className={input} />
          </label>
          <label className="block text-sm">Email kontak
            <input name="email" type="email" defaultValue={s.email} maxLength={200} className={input} />
          </label>
          <p className="text-xs text-charcoal/55">Tombol &quot;Hubungi Kami&quot; mengarah ke WhatsApp bila diisi; bila kosong, ke email.</p>
        </fieldset>
        <fieldset className="space-y-3 rounded-xl bg-white/70 p-5">
          <legend className="px-1 text-sm font-medium">Teks sambutan di footer</legend>
          <label className="block text-sm">Paragraf pertama (emas)
            <textarea name="sambutan1" rows={3} defaultValue={s.sambutan1} maxLength={500} className={input} />
          </label>
          <label className="block text-sm">Paragraf kedua
            <textarea name="sambutan2" rows={3} defaultValue={s.sambutan2} maxLength={500} className={input} />
          </label>
        </fieldset>
        <button className="rounded-lg bg-gold px-5 py-2 text-white">Simpan</button>
      </form>
    </div>
  );
}
'@

Tulis @('src','app','admin','tentang') 'page.tsx' @'
// PAKET-9E: ubah teks halaman Tentang
import { requireReviewer } from "@/lib/auth";
import { getTentang } from "@/lib/tentang";
import { resetTentang, saveTentang } from "@/lib/situs-actions";
import { ConfirmButton } from "@/components/ConfirmButton";

export const dynamic = "force-dynamic";

export default async function AdminTentang({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  await requireReviewer();
  const { ok } = await searchParams;
  const bagian = await getTentang();
  const baris = [...bagian, { kunci: "", judul: "", isi: "" }]; // satu baris kosong untuk bagian baru
  return (
    <div className="max-w-4xl">
      <h1 className="font-serif text-3xl">Halaman Tentang</h1>
      <p className="mt-1 text-sm text-charcoal/60">Setiap bagian tampil sebagai kartu di halaman Tentang. Kosongkan judul dan isi untuk menghapus sebuah bagian; isi baris paling bawah untuk menambah bagian baru.</p>
      {ok === "reset" && <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">Dikembalikan ke teks bawaan.</p>}
      {ok === "1" && <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">Perubahan disimpan.</p>}
      <details className="mt-4 rounded-xl bg-white/70 p-4 text-sm">
        <summary className="cursor-pointer font-medium">Cara menulis isi</summary>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-charcoal/75">
          <li>Pisahkan paragraf dengan satu baris kosong.</li>
          <li><code>## Subjudul</code> untuk judul kecil di dalam kartu.</li>
          <li><code>- butir</code> untuk daftar titik, <code>1. butir</code> untuk daftar bernomor (satu butir per baris).</li>
          <li><code>&gt; kutipan</code> untuk kutipan besar.</li>
          <li><code>**tebal**</code> untuk huruf tebal, <code>[teks](/agenda)</code> atau <code>[teks](https://...)</code> untuk tautan.</li>
        </ul>
      </details>
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
            <label className="block text-sm">Isi
              <textarea name={`isi_${i}`} rows={i < bagian.length ? 9 : 4} defaultValue={b.isi} maxLength={8000} className="mt-1 w-full font-mono text-[13px]" />
            </label>
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

Tulis @('src','app','(situs)','tentang') 'page.tsx' @'
// PAKET-9E: halaman Tentang; isinya dari pengaturan CMS (bawaan: teks WordPress lama)
import Link from "next/link";
import { getTentang } from "@/lib/tentang";
import { TeksKaya } from "@/components/content/TeksKaya";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tentang Memori Sejarah" };

const kartu = "rounded-2xl border border-ms-line bg-ms-surface p-6 md:p-8";
const judulKelas = "font-serif text-2xl font-bold text-ms-gold";

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
              <TeksKaya teks={b.isi} />
            </div>
          ))}
        </div>

        {logo && (
          <div className={`${kartu} mt-6`}>
            <h2 className={`${judulKelas} mb-4`}>{logo.judul}</h2>
            <div className="grid items-center gap-8 lg:grid-cols-[1.6fr_1fr]">
              <TeksKaya teks={logo.isi} />
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

TulisGanti @('src','components','layout') 'Footer.tsx' @'
// PAKET-9E: footer dengan kotak Cari Arsip, ikon sosial, dan tombol Hubungi Kami (tautan dari CMS: /admin/situs)
import Link from "next/link";
import { ambilKategoriCache } from "@/lib/data-situs";
import { getPustaka } from "@/lib/pengaturan";
import { getSitus } from "@/lib/situs";
import { Logo } from "./Logo";

const tautan = "text-sm text-ms-cream/70 hover:text-ms-gold";
const judul = "mb-4 text-xs font-bold uppercase tracking-[0.2em] text-ms-cream";
const ikonDasar = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" } as const;

const IKON: Record<string, React.ReactNode> = {
  Instagram: <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.3" cy="6.7" r="0.9" fill="currentColor" /></>,
  YouTube: <><rect x="2.5" y="5" width="19" height="14" rx="4" /><path d="m10 9 5 3-5 3z" fill="currentColor" /></>,
  WhatsApp: <><path d="M3.5 20.5 5 16a8.5 8.5 0 1 1 3 3z" /><path d="M9 8.8c.3 2.2 2.6 4.5 5.2 5.2l1.2-1.3-2-1-.9.8c-.8-.4-1.6-1.2-2-2l.8-.9-1-2z" /></>,
  Email: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3.5 7 8.5 6 8.5-6" /></>,
};

export async function Footer() {
  const [kategori, s, pustaka] = await Promise.all([ambilKategoriCache(), getSitus(), getPustaka()]);
  const cats = kategori.slice(0, 8);
  const sosial = [
    { nama: "Instagram", url: s.instagram },
    { nama: "YouTube", url: s.youtube },
    { nama: "WhatsApp", url: s.whatsapp },
    { nama: "Email", url: s.email ? `mailto:${s.email}` : "" },
  ].filter((x) => /^(https:\/\/|mailto:)/i.test(x.url));
  const kontak = /^https:\/\//i.test(s.whatsapp) ? s.whatsapp : s.email ? `mailto:${s.email}` : "/tentang/redaksi";

  return (
    <footer className="border-t border-ms-line bg-ms-bg text-ms-cream">
      <div className="mx-auto grid max-w-[90rem] gap-10 px-6 py-12 md:grid-cols-2 md:px-10 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr] lg:px-16">
        <div>
          <Logo />
          {s.sambutan1 && <p className="mt-4 max-w-sm text-sm text-ms-gold">{s.sambutan1}</p>}
          {s.sambutan2 && <p className="mt-3 max-w-sm text-sm text-ms-cream/60">{s.sambutan2}</p>}
        </div>
        <div>
          <h3 className={judul}>Artikel</h3>
          <ul className="space-y-2">
            <li><Link href="/artikel" className={tautan}>Semua Artikel</Link></li>
            {cats.map((c) => <li key={c.id}><Link href={`/kategori/${c.slug}`} className={tautan}>{c.name}</Link></li>)}
          </ul>
        </div>
        <div>
          <h3 className={judul}>Pustaka &amp; Video</h3>
          <ul className="space-y-2">
            <li><Link href="/pustaka" className={tautan}>Pustaka</Link></li>
            {pustaka.map((p) => <li key={p.kunci}><Link href={`/pustaka?f=${p.kunci}`} className={tautan}>{p.nama}</Link></li>)}
            <li><Link href="/gambar" className={tautan}>Gambar</Link></li>
            <li><Link href="/video" className={tautan}>Video</Link></li>
            <li><Link href="/agenda" className={tautan}>Agenda Kegiatan</Link></li>
          </ul>
        </div>
        <div>
          <h3 className={judul}>Cari Arsip</h3>
          <form action="/cari" role="search" className="flex items-center gap-2 rounded-full bg-ms-cream py-1.5 pl-4 pr-1.5">
            <input name="q" type="search" placeholder="Cari artikel, tokoh..." aria-label="Cari arsip" autoComplete="off" className="min-w-0 flex-1 bg-transparent text-sm text-ms-bg outline-none placeholder:text-ms-bg/50" />
            <button aria-label="Cari" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ms-bg text-ms-gold">
              <svg {...ikonDasar} className="h-4 w-4" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            </button>
          </form>
          {sosial.length > 0 && (
            <div className="mt-5 flex gap-2">
              {sosial.map((x) => (
                <a key={x.nama} href={x.url} aria-label={x.nama} title={x.nama} {...(x.url.startsWith("mailto:") ? {} : { target: "_blank", rel: "noopener noreferrer" })}
                  className="grid h-10 w-10 place-items-center rounded-full border border-ms-line text-ms-cream/80 transition hover:border-ms-gold hover:text-ms-gold">
                  <svg {...ikonDasar} className="h-5 w-5" aria-hidden="true">{IKON[x.nama]}</svg>
                </a>
              ))}
            </div>
          )}
          {kontak.startsWith("/") ? (
            <Link href={kontak} className="mt-5 inline-block rounded-full bg-gradient-to-r from-emerald-500 to-yellow-400 px-6 py-2.5 text-sm font-semibold text-ms-bg transition hover:brightness-110">Hubungi Kami</Link>
          ) : (
            <a href={kontak} {...(kontak.startsWith("mailto:") ? {} : { target: "_blank", rel: "noopener noreferrer" })} className="mt-5 inline-block rounded-full bg-gradient-to-r from-emerald-500 to-yellow-400 px-6 py-2.5 text-sm font-semibold text-ms-bg transition hover:brightness-110">Hubungi Kami</a>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-ms-line px-6 py-5 text-xs text-ms-cream/50">
        <span>&copy; 2023&ndash;{new Date().getFullYear()} Memori Sejarah. Dibuat dengan ingatan.</span>
        <Link href="/tentang" className="hover:text-ms-gold">Tentang</Link>
        <Link href="/tentang/redaksi" className="hover:text-ms-gold">Redaksi</Link>
        <Link href="/privasi" className="hover:text-ms-gold">Kebijakan Privasi</Link>
      </div>
    </footer>
  );
}
'@ 'export async function Footer'

$lf = P 'src' 'app' 'admin' 'layout.tsx'
Ganti $lf '{ label: "Redaksi", href: "/admin/redaksi", ikon: "redaksi" },' ('{ label: "Redaksi", href: "/admin/redaksi", ikon: "redaksi" },' + "`r`n" + '            { label: "Halaman Tentang", href: "/admin/tentang", ikon: "tentang" },' + "`r`n" + '            { label: "Pengaturan Situs", href: "/admin/situs", ikon: "pengaturan" },') 'Menu CMS (Tentang dan Pengaturan Situs)'
Write-Host ''
Write-Host 'Selesai. Muat ulang halaman (npm run dev tetap jalan). Tidak ada perintah database tambahan.' -ForegroundColor Cyan

# Paket 9C: redaksi dengan profil anggota + CMS. ASCII saja, idempoten.. ASCII saja, idempoten.. ASCII saja, idempoten.
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








Tulis @('src','lib') 'redaksi.ts' @'
// PAKET-9C: konstanta dan pembantu untuk redaksi (tidak berisi data pribadi)
export const TIM = [
  { kunci: "editor", nama: "Tim Editor dan Kreatif" },
  { kunci: "humas", nama: "Tim Humas & Jaringan Relasi" },
  { kunci: "it", nama: "Tim IT (Situs Website)" },
  { kunci: "sosmed", nama: "Tim Sosial-Media" },
  { kunci: "riset", nama: "Tim Riset" },
] as const;

export const namaTim = (kunci: string) => TIM.find((t) => t.kunci === kunci)?.nama ?? kunci;

export const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim()
    .replace(/[\s_]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

// Nomor WhatsApp: hanya angka, awalan 0 atau 8 dijadikan 62 (Indonesia)
export const waDigits = (s: string): string => {
  let d = s.replace(/[^\d]/g, "");
  if (d.startsWith("0")) d = "62" + d.slice(1);
  else if (d.startsWith("8")) d = "62" + d;
  return d.slice(0, 20);
};

// Tautan https saja. Kosong -> "", tidak valid -> null
export const tautanHttps = (input: string): string | null => {
  const v = input.trim();
  if (!v) return "";
  try {
    const u = new URL(/^[a-z]+:\/\//i.test(v) ? v.replace(/^http:\/\//i, "https://") : `https://${v}`);
    return u.protocol === "https:" && v.length <= 500 ? u.toString() : null;
  } catch {
    return null;
  }
};

// Instagram: boleh @nama, nama, atau tautan
export const tautanInstagram = (input: string): string | null => {
  const v = input.trim();
  if (!v) return "";
  if (v.includes("/") || v.includes(".com")) return tautanHttps(v);
  const h = v.replace(/^@/, "");
  return /^[A-Za-z0-9._]{1,30}$/.test(h) ? `https://www.instagram.com/${h}/` : null;
};

// Pertahanan tambahan saat menampilkan: hanya https atau mailto
export const tautanAman = (u: string) => /^(https:\/\/|mailto:)/i.test(u);
'@

Tulis @('src','lib') 'redaksi-actions.ts' @'
// PAKET-9C: aksi server untuk redaksi (admin dan editor)
"use server";
import { redirect } from "next/navigation";
import { and, eq, ne } from "drizzle-orm";
import { db, redaksi, redaksiTim } from "@/db";
import { requireReviewer } from "./auth";
import { unggahKeImageKit } from "./gambar-simpan";
import { TIM, slugify, tautanHttps, tautanInstagram, waDigits } from "./redaksi";

export async function saveRedaksi(fd: FormData) {
  await requireReviewer();
  const d = db();
  const id = Number(fd.get("id")) || null;
  const s = (k: string, maks: number) => String(fd.get(k) ?? "").trim().slice(0, maks);
  const name = s("name", 120);
  const sufiks = id ? `&edit=${id}` : "";
  if (!name) redirect(`/admin/redaksi?error=nama${sufiks}`);

  const [old] = id ? await d.select().from(redaksi).where(eq(redaksi.id, id)).limit(1) : [];
  if (id && !old) redirect("/admin/redaksi");

  const slug = slugify(s("slug", 80)) || old?.slug || slugify(name.split(",")[0]) || "anggota";
  const [dup] = await d.select({ id: redaksi.id }).from(redaksi)
    .where(id ? and(eq(redaksi.slug, slug), ne(redaksi.id, id)) : eq(redaksi.slug, slug)).limit(1);
  if (dup) redirect(`/admin/redaksi?error=slug${sufiks}`);

  const email = s("email", 200);
  if (email && !/^\S+@\S+\.\S+$/.test(email)) redirect(`/admin/redaksi?error=email${sufiks}`);
  const instagram = tautanInstagram(s("instagram", 200));
  const linkedin = tautanHttps(s("linkedin", 500));
  const facebook = tautanHttps(s("facebook", 500));
  const website = tautanHttps(s("website", 500));
  if (instagram === null || linkedin === null || facebook === null || website === null) redirect(`/admin/redaksi?error=tautan${sufiks}`);

  // Foto: berkas unggahan, tautan https, atau tetap yang lama
  let fotoUrl: string | null = old?.fotoUrl ?? null;
  if (String(fd.get("sumber")) === "berkas") {
    const f = fd.get("berkas");
    if (f instanceof File && f.size > 0) {
      const h = await unggahKeImageKit(f, slug);
      if ("galat" in h) redirect(`/admin/redaksi?error=${h.galat}${sufiks}`);
      fotoUrl = h.url;
    }
  } else {
    const u = tautanHttps(s("url", 500));
    if (u === null) redirect(`/admin/redaksi?error=tautan${sufiks}`);
    fotoUrl = u || null;
  }

  const nilai = {
    slug, name,
    peran: s("peran", 160),
    pemimpin: fd.get("pemimpin") === "on",
    urutan: Math.max(0, Math.min(9999, Math.round(Number(fd.get("urutan")) || 0))),
    bidang: s("bidang", 300),
    bio: s("bio", 4000),
    fotoUrl,
    domisili: s("domisili", 120),
    email,
    whatsapp: waDigits(s("whatsapp", 40)),
    instagram, linkedin, facebook, website,
    userId: Number(fd.get("userId")) || null,
    aktif: fd.get("aktif") === "on",
    updatedAt: new Date(),
  };

  let mid: number;
  if (id) {
    await d.update(redaksi).set(nilai).where(eq(redaksi.id, id));
    mid = id;
  } else {
    const [r] = await d.insert(redaksi).values(nilai).returning({ id: redaksi.id });
    mid = r.id;
  }
  await d.delete(redaksiTim).where(eq(redaksiTim.memberId, mid));
  const dipilih = fd.getAll("tim").map(String);
  const baris = TIM.filter((t) => dipilih.includes(t.kunci)).map((t) => ({ memberId: mid, tim: t.kunci, catatan: s(`catatan_${t.kunci}`, 120) }));
  if (baris.length) await d.insert(redaksiTim).values(baris);
  redirect("/admin/redaksi?ok=simpan");
}

export async function deleteRedaksi(fd: FormData) {
  await requireReviewer();
  const id = Number(fd.get("id"));
  if (id) await db().delete(redaksi).where(eq(redaksi.id, id));
  redirect("/admin/redaksi?ok=hapus");
}
'@

Tulis @('src','components','content') 'Avatar.tsx' @'
// PAKET-9C: foto anggota atau inisial bila belum ada foto
import { kecil } from "@/lib/gambar-url";

export function Avatar({ nama, url, ukuran = 48 }: { nama: string; url: string | null; ukuran?: number }) {
  const awal = nama.split(",")[0].split(" ").filter(Boolean).slice(0, 2).map((x) => x[0]).join("").toUpperCase();
  return url ? (
    <img src={kecil(url, ukuran * 2)} alt="" width={ukuran} height={ukuran} loading="lazy" referrerPolicy="no-referrer"
      className="shrink-0 rounded-full object-cover" style={{ width: ukuran, height: ukuran }} />
  ) : (
    <span className="grid shrink-0 place-items-center rounded-full bg-ms-gold/20 font-serif font-bold text-ms-gold" style={{ width: ukuran, height: ukuran, fontSize: ukuran / 2.8 }}>{awal}</span>
  );
}
'@

Tulis @('scripts') 'seed-redaksi.ts' @'
// PAKET-9C: membuat tabel redaksi dan mengisi susunan awal (hanya nama dan tim; TANPA data pribadi). Aman dijalankan ulang.
// Jalankan: npx tsx --env-file=.env.local scripts\seed-redaksi.ts
import { neon } from "@neondatabase/serverless";

type Anggota = { slug: string; name: string; peran: string; pemimpin: boolean; urutan: number; tim: [string, string][] };
const AWAL: Anggota[] = [
  { slug: "muhammad-aslambik", name: "Muhammad Aslambik, S.Hum.", peran: "Pendiri & Pemimpin Redaksi", pemimpin: true, urutan: 1, tim: [["editor", ""], ["humas", ""], ["it", ""], ["riset", ""]] },
  { slug: "sigid-nugrohowati", name: "Sigid Nugrohowati", peran: "", pemimpin: false, urutan: 2, tim: [["editor", ""], ["sosmed", "Grup WA & Saluran WA"], ["riset", ""]] },
  { slug: "rifky-arya-pramadana", name: "Rifky Arya Pramadana", peran: "", pemimpin: false, urutan: 3, tim: [["editor", ""], ["humas", ""], ["sosmed", "YouTube"], ["riset", ""]] },
  { slug: "dewa-alfaquin-faturangga", name: "Dewa Alfaquin Faturangga, S.Hum.", peran: "", pemimpin: false, urutan: 4, tim: [["humas", ""], ["riset", ""]] },
  { slug: "iqbal-al-irfan", name: "Iqbal Al Irfan, S.Hum.", peran: "", pemimpin: false, urutan: 5, tim: [["editor", ""], ["riset", ""]] },
  { slug: "fajri-ana-zahrotul-jannah", name: "Fajri Ana Zahrotul Jannah, S.Hum.", peran: "", pemimpin: false, urutan: 6, tim: [["editor", ""], ["sosmed", "Instagram"], ["riset", ""]] },
  { slug: "amin-nur-huda", name: "Amin Nur Huda, S.Hum.", peran: "", pemimpin: false, urutan: 7, tim: [["riset", ""]] },
  { slug: "rina-mutoharoh", name: "Rina Mutoharoh, S.Hum.", peran: "", pemimpin: false, urutan: 8, tim: [["riset", ""]] },
  { slug: "arya-bagus-nur-ajiyanto", name: "Arya Bagus Nur Ajiyanto, S.Hum.", peran: "", pemimpin: false, urutan: 9, tim: [["riset", ""]] },
];

const norm = (s: string) => s.split(",")[0].toLowerCase().replace(/[^a-z]/g, "");

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL belum terisi di .env.local");
  const sql = neon(process.env.DATABASE_URL);
  await sql`
    CREATE TABLE IF NOT EXISTS redaksi (
      id serial PRIMARY KEY,
      slug text NOT NULL UNIQUE,
      name text NOT NULL,
      peran text NOT NULL DEFAULT '',
      pemimpin boolean NOT NULL DEFAULT false,
      urutan integer NOT NULL DEFAULT 0,
      bidang text NOT NULL DEFAULT '',
      bio text NOT NULL DEFAULT '',
      foto_url text,
      domisili text NOT NULL DEFAULT '',
      email text NOT NULL DEFAULT '',
      whatsapp text NOT NULL DEFAULT '',
      instagram text NOT NULL DEFAULT '',
      linkedin text NOT NULL DEFAULT '',
      facebook text NOT NULL DEFAULT '',
      website text NOT NULL DEFAULT '',
      user_id integer REFERENCES users(id) ON DELETE SET NULL,
      aktif boolean NOT NULL DEFAULT true,
      updated_at timestamp NOT NULL DEFAULT now()
    )`;
  await sql`
    CREATE TABLE IF NOT EXISTS redaksi_tim (
      member_id integer NOT NULL REFERENCES redaksi(id) ON DELETE CASCADE,
      tim text NOT NULL,
      catatan text NOT NULL DEFAULT '',
      CONSTRAINT redaksi_tim_member_id_tim_pk PRIMARY KEY (member_id, tim)
    )`;

  const pengguna = await sql`SELECT id, name, email FROM users`;
  const admin = (process.env.ADMIN_EMAIL ?? "").toLowerCase();
  let baru = 0;
  for (const a of AWAL) {
    const [ada] = await sql`SELECT id FROM redaksi WHERE slug = ${a.slug}`;
    if (ada) continue;
    const cocok = a.pemimpin
      ? pengguna.find((u) => String(u.email).toLowerCase() === admin)
      : pengguna.find((u) => norm(String(u.name)) === norm(a.name));
    const [r] = await sql`INSERT INTO redaksi (slug, name, peran, pemimpin, urutan, user_id) VALUES (${a.slug}, ${a.name}, ${a.peran}, ${a.pemimpin}, ${a.urutan}, ${cocok ? Number(cocok.id) : null}) RETURNING id`;
    for (const [tim, catatan] of a.tim) await sql`INSERT INTO redaksi_tim (member_id, tim, catatan) VALUES (${Number(r.id)}, ${tim}, ${catatan}) ON CONFLICT DO NOTHING`;
    baru++;
  }
  const hasil = await sql`SELECT r.name, r.urutan, (SELECT count(*)::int FROM redaksi_tim t WHERE t.member_id = r.id) AS tim, (r.user_id IS NOT NULL) AS terhubung FROM redaksi r ORDER BY r.urutan`;
  console.log(`Selesai. Anggota baru: ${baru}`);
  console.table(hasil);
}
main().catch((e) => { console.error(e); process.exit(1); });
'@

Tulis @('src','app','admin','redaksi') 'page.tsx' @'
// PAKET-9C: kelola redaksi dan profil anggota (admin dan editor)
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db, redaksi, redaksiTim, users } from "@/db";
import { requireReviewer } from "@/lib/auth";
import { saveRedaksi, deleteRedaksi } from "@/lib/redaksi-actions";
import { TIM, namaTim } from "@/lib/redaksi";
import { penyimpananSiap } from "@/lib/gambar-simpan";
import { ConfirmButton } from "@/components/ConfirmButton";
import { PilihSumberGambar } from "@/components/admin/PilihSumberGambar";
import { Avatar } from "@/components/content/Avatar";

export const dynamic = "force-dynamic";

const errors: Record<string, string> = {
  nama: "Nama wajib diisi.",
  slug: "Slug itu sudah dipakai anggota lain.",
  email: "Format email tidak valid.",
  tautan: "Tautan harus berupa alamat https yang valid (Instagram boleh @nama).",
  belum: "Penyimpanan ImageKit belum disiapkan. Gunakan tautan foto dulu.",
  berkas: "Berkas foto tidak valid (JPG, PNG, WEBP, GIF; maksimal 10 MB).",
  unggah: "Unggah foto gagal. Coba lagi.",
};
const oks: Record<string, string> = { simpan: "Anggota disimpan.", hapus: "Anggota dihapus." };

export default async function AdminRedaksi({ searchParams }: { searchParams: Promise<{ edit?: string; error?: string; ok?: string }> }) {
  await requireReviewer();
  const { edit, error, ok } = await searchParams;
  const editId = Number(edit) || null;
  const d = db();
  const [daftar, relasi, akun] = await Promise.all([
    d.select().from(redaksi).orderBy(redaksi.urutan, redaksi.name),
    d.select().from(redaksiTim),
    d.select({ id: users.id, name: users.name }).from(users).orderBy(users.name),
  ]);
  const m = editId ? daftar.find((x) => x.id === editId) : undefined;
  const timM = new Map(relasi.filter((r) => r.memberId === m?.id).map((r) => [r.tim, r.catatan]));
  const input = "mt-1 w-full rounded border p-2";
  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <h1 className="font-serif text-3xl">Redaksi</h1>
      <p className="mt-1 text-sm text-charcoal/60">Susunan redaksi dan profil anggota di halaman Tentang. Hanya kolom yang diisi yang tampil di situs.</p>
      {error && <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">{errors[error] ?? "Terjadi kesalahan."}</p>}
      {ok && <p className="mt-4 rounded bg-green-50 p-3 text-sm text-green-800">{oks[ok] ?? "Berhasil."}</p>}

      <form key={m?.id ?? "baru"} action={saveRedaksi} className="mt-6 space-y-4 rounded bg-white/70 p-5">
        <h2 className="font-medium">{m ? "Ubah anggota" : "Tambah anggota"}</h2>
        {m && <input type="hidden" name="id" value={m.id} />}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">Nama (boleh dengan gelar)
            <input name="name" required maxLength={120} defaultValue={m?.name} className={input} />
          </label>
          <label className="block text-sm">Jabatan atau peran
            <input name="peran" maxLength={160} defaultValue={m?.peran} placeholder="contoh: Pendiri & Pemimpin Redaksi" className={input} />
          </label>
          <label className="block text-sm">Slug (alamat profil; kosongkan agar dibuat dari nama)
            <input name="slug" defaultValue={m?.slug} className={input} />
          </label>
          <label className="block text-sm">Urutan tampil (angka kecil lebih dulu)
            <input name="urutan" type="number" min={0} max={9999} defaultValue={m?.urutan ?? 0} className={input} />
          </label>
        </div>

        <PilihSumberGambar key={`foto-${m?.id ?? "baru"}`} defaultUrl={m?.fotoUrl ?? ""} baru={false} siap={penyimpananSiap()} />
        {m?.fotoUrl && <Avatar nama={m.name} url={m.fotoUrl} ukuran={96} />}

        <label className="block text-sm">Bidang penelitian atau keahlian
          <input name="bidang" maxLength={300} defaultValue={m?.bidang} className={input} />
        </label>
        <label className="block text-sm">Profil singkat (biografi)
          <textarea name="bio" rows={5} maxLength={4000} defaultValue={m?.bio} className={input} />
        </label>

        <fieldset className="rounded border p-4">
          <legend className="px-1 text-sm font-medium">Kontak dan tautan (opsional)</legend>
          <p className="mb-3 text-xs text-charcoal/60">Hanya yang diisi yang tampil di profil publik. Pastikan anggota yang bersangkutan setuju sebelum menampilkan email, WhatsApp, atau domisili. Untuk domisili, cukup kota; jangan alamat lengkap.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">Domisili (kota)
              <input name="domisili" maxLength={120} defaultValue={m?.domisili} placeholder="contoh: Semarang" className={input} />
            </label>
            <label className="block text-sm">Email
              <input name="email" type="email" maxLength={200} defaultValue={m?.email} className={input} />
            </label>
            <label className="block text-sm">WhatsApp (contoh: 0812xxxxxxx)
              <input name="whatsapp" maxLength={40} defaultValue={m?.whatsapp ? `+${m.whatsapp}` : ""} className={input} />
            </label>
            <label className="block text-sm">Instagram (@nama atau tautan)
              <input name="instagram" maxLength={200} defaultValue={m?.instagram} className={input} />
            </label>
            <label className="block text-sm">LinkedIn (tautan)
              <input name="linkedin" maxLength={500} defaultValue={m?.linkedin} className={input} />
            </label>
            <label className="block text-sm">Facebook (tautan)
              <input name="facebook" maxLength={500} defaultValue={m?.facebook} className={input} />
            </label>
            <label className="block text-sm sm:col-span-2">Situs web pribadi (tautan)
              <input name="website" maxLength={500} defaultValue={m?.website} className={input} />
            </label>
          </div>
        </fieldset>

        <fieldset className="rounded border p-4">
          <legend className="px-1 text-sm font-medium">Tim</legend>
          <div className="space-y-2">
            {TIM.map((t) => (
              <div key={t.kunci} className="flex flex-wrap items-center gap-3 text-sm">
                <label className="flex w-64 items-center gap-2">
                  <input type="checkbox" name="tim" value={t.kunci} defaultChecked={timM.has(t.kunci)} /> {t.nama}
                </label>
                <input name={`catatan_${t.kunci}`} maxLength={120} defaultValue={timM.get(t.kunci) ?? ""} placeholder="catatan (opsional, contoh: Instagram)" className="min-w-0 flex-1 rounded border p-1.5" />
              </div>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-wrap gap-6 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" name="pemimpin" defaultChecked={m?.pemimpin} /> Pendiri atau pemimpin redaksi (ditampilkan di kotak khusus)</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="aktif" defaultChecked={m ? m.aktif : true} /> Tampilkan di situs</label>
        </div>
        <label className="block text-sm sm:max-w-sm">Hubungkan dengan akun penulis (untuk menampilkan tulisannya di profil)
          <select name="userId" defaultValue={m?.userId ?? ""} className={input}>
            <option value="">(tidak dihubungkan)</option>
            {akun.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </label>
        <div className="flex gap-3">
          <button className="rounded bg-gold px-4 py-2 text-white">{m ? "Simpan perubahan" : "Tambah anggota"}</button>
          {m && <Link href="/admin/redaksi" className="rounded border px-4 py-2">Batal</Link>}
        </div>
      </form>

      <h2 className="mt-10 font-medium">Semua anggota ({daftar.length})</h2>
      {daftar.length === 0 ? (
        <p className="mt-2 text-sm text-charcoal/60">Belum ada anggota. Jalankan skrip seed-redaksi atau tambah lewat formulir di atas.</p>
      ) : (
        <ul className="mt-3 divide-y divide-cream-dark rounded bg-white/70">
          {daftar.map((x) => (
            <li key={x.id} className="flex items-center justify-between gap-3 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar nama={x.name} url={x.fotoUrl} ukuran={40} />
                <div className="min-w-0">
                  <Link href={`/admin/redaksi?edit=${x.id}`} className="font-medium hover:text-gold-dark">{x.name}</Link>
                  <span className="ml-2 text-xs text-charcoal/50">#{x.urutan}</span>
                  {!x.aktif && <span className="ml-2 rounded bg-cream-dark px-2 py-0.5 text-xs">tersembunyi</span>}
                  <p className="truncate text-xs text-charcoal/60">
                    {[x.peran, ...relasi.filter((r) => r.memberId === x.id).map((r) => namaTim(r.tim))].filter(Boolean).join(" \u2022 ")}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-4">
                {x.aktif && <Link href={`/tentang/redaksi/${x.slug}`} className="text-sm text-charcoal/60 hover:text-gold-dark">Lihat</Link>}
                <form action={deleteRedaksi}>
                  <input type="hidden" name="id" value={x.id} />
                  <ConfirmButton pesan={`Hapus anggota "${x.name}"?`} />
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
'@

Tulis @('src','app','(situs)','tentang','redaksi') 'page.tsx' @'
// PAKET-9C: susunan redaksi dari database; setiap nama menuju halaman profil
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db, redaksi, redaksiTim } from "@/db";
import { TIM } from "@/lib/redaksi";
import { Avatar } from "@/components/content/Avatar";

export const dynamic = "force-dynamic";
export const metadata = { title: "Susunan Redaksi" };

export default async function Redaksi() {
  let anggota: { id: number; slug: string; name: string; peran: string; pemimpin: boolean; fotoUrl: string | null }[] = [];
  let relasi: { memberId: number; tim: string; catatan: string }[] = [];
  try {
    [anggota, relasi] = await Promise.all([
      db().select({ id: redaksi.id, slug: redaksi.slug, name: redaksi.name, peran: redaksi.peran, pemimpin: redaksi.pemimpin, fotoUrl: redaksi.fotoUrl })
        .from(redaksi).where(eq(redaksi.aktif, true)).orderBy(redaksi.urutan, redaksi.name),
      db().select().from(redaksiTim),
    ]);
  } catch { /* tabel belum dibuat: tampilkan halaman kosong */ }

  const pemimpin = anggota.filter((a) => a.pemimpin);
  const sudahDiTim = new Set(relasi.map((r) => r.memberId));
  const lain = anggota.filter((a) => !a.pemimpin && !sudahDiTim.has(a.id));
  const nama = (a: { slug: string; name: string }) => (
    <Link href={`/tentang/redaksi/${a.slug}`} className="underline-offset-4 hover:text-ms-gold hover:underline">{a.name}</Link>
  );

  return (
    <div className="-mb-16 min-h-[70vh] bg-ms-bg pb-24 text-ms-cream">
      <section className="mx-auto max-w-[90rem] px-6 pt-12 md:px-10 lg:px-16">
        <h1 className="font-serif text-4xl font-bold md:text-5xl">Susunan Redaksi</h1>
        <p className="mt-3 text-ms-cream/70">Klik nama untuk melihat profil anggota.</p>
        {anggota.length === 0 && <p className="mt-8 text-ms-cream/60">Susunan redaksi belum diatur.</p>}

        {pemimpin.map((a) => (
          <div key={a.id} className="mt-8 flex items-center gap-5 rounded-2xl border border-ms-gold/40 bg-ms-surface p-6 md:p-8">
            <Avatar nama={a.name} url={a.fotoUrl} ukuran={72} />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ms-gold">{a.peran || "Pendiri & Pemimpin Redaksi"}</p>
              <p className="mt-2 font-serif text-2xl font-bold">{nama(a)}</p>
            </div>
          </div>
        ))}

        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {TIM.map((t) => {
            const isi = relasi.filter((r) => r.tim === t.kunci)
              .map((r) => ({ r, a: anggota.find((x) => x.id === r.memberId) }))
              .filter((x): x is { r: (typeof relasi)[number]; a: (typeof anggota)[number] } => !!x.a);
            if (isi.length === 0) return null;
            return (
              <div key={t.kunci} className="rounded-2xl border border-ms-line bg-ms-surface p-6">
                <h2 className="font-serif text-xl font-bold text-ms-gold">{t.nama}</h2>
                <ul className="mt-4 space-y-2 text-ms-cream/80">
                  {isi.map(({ r, a }) => (
                    <li key={a.id}>{nama(a)}{r.catatan && <span className="text-ms-cream/50"> ({r.catatan})</span>}</li>
                  ))}
                </ul>
              </div>
            );
          })}
          {lain.length > 0 && (
            <div className="rounded-2xl border border-ms-line bg-ms-surface p-6">
              <h2 className="font-serif text-xl font-bold text-ms-gold">Anggota Lainnya</h2>
              <ul className="mt-4 space-y-2 text-ms-cream/80">{lain.map((a) => <li key={a.id}>{nama(a)}</li>)}</ul>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
'@

Tulis @('src','app','(situs)','tentang','redaksi','[slug]') 'page.tsx' @'
// PAKET-9C: halaman profil anggota redaksi
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { db, redaksi, redaksiTim, posts } from "@/db";
import { kolomKartu } from "@/lib/kolom";
import { kecil } from "@/lib/gambar-url";
import { namaTim, tautanAman } from "@/lib/redaksi";
import { Avatar } from "@/components/content/Avatar";
import { PostCardMini } from "@/components/content/PostCardMini";

export const dynamic = "force-dynamic";

const cari = async (slug: string) => {
  try {
    const [m] = await db().select().from(redaksi).where(and(eq(redaksi.slug, slug), eq(redaksi.aktif, true))).limit(1);
    return m;
  } catch {
    return undefined;
  }
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const m = await cari((await params).slug);
  if (!m) return {};
  return {
    title: `${m.name} - Redaksi`,
    description: (m.bio || m.peran).slice(0, 160),
    openGraph: m.fotoUrl ? { images: [kecil(m.fotoUrl, 800)] } : undefined,
  };
}

export default async function Profil({ params }: { params: Promise<{ slug: string }> }) {
  const m = await cari((await params).slug);
  if (!m) notFound();
  const d = db();
  const [tim, tulisan] = await Promise.all([
    d.select().from(redaksiTim).where(eq(redaksiTim.memberId, m.id)),
    m.userId
      ? d.select(kolomKartu).from(posts).where(and(eq(posts.authorId, m.userId), eq(posts.status, "published"))).orderBy(desc(posts.publishedAt)).limit(10)
      : Promise.resolve([]),
  ]);

  const kontak: [string, string][] = [];
  if (m.email) kontak.push(["Email", `mailto:${m.email}`]);
  if (m.whatsapp) kontak.push(["WhatsApp", `https://wa.me/${m.whatsapp}`]);
  if (m.instagram) kontak.push(["Instagram", m.instagram]);
  if (m.linkedin) kontak.push(["LinkedIn", m.linkedin]);
  if (m.facebook) kontak.push(["Facebook", m.facebook]);
  if (m.website) kontak.push(["Situs web", m.website]);
  const aman = kontak.filter(([, u]) => tautanAman(u));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: m.name,
    ...(m.peran ? { jobTitle: m.peran } : {}),
    ...(m.fotoUrl ? { image: m.fotoUrl } : {}),
    worksFor: { "@type": "Organization", name: "Memori Sejarah" },
    ...(aman.filter(([k]) => k !== "Email" && k !== "WhatsApp").length ? { sameAs: aman.filter(([k]) => k !== "Email" && k !== "WhatsApp").map(([, u]) => u) } : {}),
  };

  const baris = (judul: string, isi: string) => isi ? (
    <div className="mt-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ms-gold">{judul}</p>
      <p className="mt-1 text-ms-cream/85">{isi}</p>
    </div>
  ) : null;

  return (
    <div className="-mb-16 min-h-[70vh] bg-ms-bg pb-24 text-ms-cream">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <section className="mx-auto max-w-5xl px-6 pt-12">
        <Link href="/tentang/redaksi" className="text-sm text-ms-cream/60 hover:text-ms-gold">&larr; Susunan Redaksi</Link>
        <div className="mt-6 flex flex-col gap-8 rounded-2xl border border-ms-line bg-ms-surface p-6 md:flex-row md:p-10">
          <div className="shrink-0"><Avatar nama={m.name} url={m.fotoUrl} ukuran={180} /></div>
          <div className="min-w-0">
            <h1 className="font-serif text-3xl font-bold md:text-4xl">{m.name}</h1>
            {m.peran && <p className="mt-2 text-ms-gold">{m.peran}</p>}
            {tim.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {tim.map((t) => <span key={t.tim} className="rounded-full border border-ms-line px-3 py-1 text-xs text-ms-cream/80">{namaTim(t.tim)}{t.catatan ? ` (${t.catatan})` : ""}</span>)}
              </div>
            )}
            {baris("Bidang penelitian", m.bidang)}
            {baris("Domisili", m.domisili)}
            {m.bio && <p className="mt-5 whitespace-pre-line leading-relaxed text-ms-cream/85">{m.bio}</p>}
            {aman.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {aman.map(([label, url]) => (
                  <a key={label} href={url} {...(url.startsWith("mailto:") ? {} : { target: "_blank", rel: "noopener noreferrer" })}
                    className="rounded-full border border-ms-line px-4 py-1.5 text-sm text-ms-cream/85 transition hover:border-ms-gold hover:text-ms-gold">{label}</a>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
      {tulisan.length > 0 && (
        <section className="mx-auto mt-12 max-w-[90rem] px-6 md:px-10 lg:px-16">
          <h2 className="font-serif text-2xl font-bold">Tulisan oleh {m.name.split(",")[0]}</h2>
          <div className="mt-5 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-5">
            {tulisan.map((p) => <PostCardMini key={p.id} p={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
'@

# schema.ts: tabel redaksi dan redaksiTim
$sf = P 'src' 'db' 'schema.ts'
$st = [System.IO.File]::ReadAllText($sf)
if ($st.Contains('redaksiTim')) { Write-Host 'schema.ts: redaksi sudah ada (dilewati).' -ForegroundColor Yellow }
else {
  $tambah = @'
// Redaksi: profil anggota dan keanggotaan tim (dikelola lewat /admin/redaksi)
export const redaksi = pgTable("redaksi", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  peran: text("peran").default("").notNull(),
  pemimpin: boolean("pemimpin").default(false).notNull(),
  urutan: integer("urutan").default(0).notNull(),
  bidang: text("bidang").default("").notNull(),
  bio: text("bio").default("").notNull(),
  fotoUrl: text("foto_url"),
  domisili: text("domisili").default("").notNull(),
  email: text("email").default("").notNull(),
  whatsapp: text("whatsapp").default("").notNull(),
  instagram: text("instagram").default("").notNull(),
  linkedin: text("linkedin").default("").notNull(),
  facebook: text("facebook").default("").notNull(),
  website: text("website").default("").notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  aktif: boolean("aktif").default(true).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const redaksiTim = pgTable("redaksi_tim", {
  memberId: integer("member_id").references(() => redaksi.id, { onDelete: "cascade" }).notNull(),
  tim: text("tim").notNull(),
  catatan: text("catatan").default("").notNull(),
}, (t) => [primaryKey({ columns: [t.memberId, t.tim] })]);
'@
  $st = $st.TrimEnd() + "`r`n`r`n" + $tambah.Replace("`r`n","`n").Replace("`n","`r`n") + "`r`n"
  [System.IO.File]::WriteAllText($sf, $st, $utf8)
  Write-Host 'schema.ts: tabel redaksi ditambahkan.' -ForegroundColor Green
}
# menu CMS
$lf = P 'src' 'app' 'admin' 'layout.tsx'
Ganti $lf '{ label: "Pustaka", href: "/admin/pustaka" }]' '{ label: "Pustaka", href: "/admin/pustaka" }, { label: "Redaksi", href: "/admin/redaksi" }]' 'Menu CMS Redaksi'
Write-Host ''
Write-Host 'Langkah berikutnya (WAJIB, sekali saja):' -ForegroundColor Cyan
Write-Host '  npx tsx --env-file=.env.local scripts\seed-redaksi.ts' -ForegroundColor Cyan
Write-Host 'Lalu muat ulang halaman (npm run dev tetap jalan).' -ForegroundColor Cyan

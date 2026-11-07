// PAKET-15G: mengambil foto profil penulis dari WordPress (Gravatar, sistem foto profil yang dipakai WordPress.com
// berdasarkan email penulis hasil impor) HANYA untuk penulis yang memang punya foto. Yang tidak punya dilewati.
//  - Tanpa opsi: simulasi (hanya menampilkan nama penulis yang punya foto; tidak mengubah apa pun)
//  - --terapkan: mengunggah foto ke ImageKit (folder /memori-sejarah/foto-akun) dan mengisi foto akun
//    (akun yang sudah punya foto TIDAK ditimpa; tambahkan --timpa bila ingin menimpa)
// Alamat email tidak ditampilkan. Jalankan: npx tsx --env-file=.env.local scripts\ambil-foto-wordpress.ts [--terapkan] [--timpa]
import { neon } from "@neondatabase/serverless";
import { createHash } from "node:crypto";

const arg = (n: string) => process.argv.includes(n);
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL belum terisi di .env.local");
if (arg("--terapkan") && !process.env.IMAGEKIT_PRIVATE_KEY) throw new Error("IMAGEKIT_PRIVATE_KEY belum terisi di .env.local");
const sql = neon(process.env.DATABASE_URL);

const jenis = (b: Buffer): "jpg" | "png" | "gif" | "webp" | null => {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "png";
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return "gif";
  if (b.length > 12 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") return "webp";
  return null;
};
const slug = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^\w]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "penulis";

async function ambilGravatar(email: string): Promise<Buffer | null> {
  const h = createHash("md5").update(email.trim().toLowerCase()).digest("hex");
  // d=404: bila penulis tidak punya foto, server menjawab 404 (bukan gambar bawaan)
  const res = await fetch(`https://www.gravatar.com/avatar/${h}?s=512&d=404`, { redirect: "follow" });
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  return jenis(buf) ? buf : null;
}

async function unggah(buf: Buffer, nama: string): Promise<string> {
  const ext = jenis(buf)!;
  const fd = new FormData();
  fd.set("file", new Blob([new Uint8Array(buf)]), `x.${ext}`);
  fd.set("fileName", `foto-${slug(nama)}.${ext}`);
  fd.set("folder", "/memori-sejarah/foto-akun");
  fd.set("useUniqueFileName", "true");
  const res = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
    method: "POST",
    headers: { Authorization: "Basic " + Buffer.from(process.env.IMAGEKIT_PRIVATE_KEY + ":").toString("base64") },
    body: fd,
  });
  if (!res.ok) throw new Error(`ImageKit menolak unggahan (${res.status})`);
  const j = (await res.json()) as { url?: string };
  if (!j.url?.startsWith("https://")) throw new Error("ImageKit tidak mengembalikan alamat gambar");
  return j.url;
}

async function main() {
  const terapkan = arg("--terapkan");
  const timpa = arg("--timpa");
  const baris = (await sql`SELECT id, name, email, photo_url FROM users WHERE active = true ORDER BY name`) as { id: number; name: string; email: string; photo_url: string | null }[];
  console.log(`${terapkan ? "TERAPKAN" : "SIMULASI"}: memeriksa ${baris.length} akun aktif...\n`);
  let ada = 0, tanpa = 0, dilewati = 0, tersimpan = 0;
  for (const u of baris) {
    if (/@memorisejarah\.eu\.org$/i.test(u.email)) { console.log(`-  ${u.name}: akun situs (bukan email WordPress), dilewati`); dilewati++; continue; }
    if (u.photo_url && !timpa) { console.log(`=  ${u.name}: sudah punya foto, dilewati`); dilewati++; continue; }
    let buf: Buffer | null = null;
    try { buf = await ambilGravatar(u.email); } catch (e) { console.log(`!  ${u.name}: gagal menghubungi WordPress/Gravatar (${(e as Error).message})`); continue; }
    if (!buf) { console.log(`.  ${u.name}: tidak punya foto di WordPress`); tanpa++; continue; }
    ada++;
    if (!terapkan) { console.log(`+  ${u.name}: ADA foto (${Math.round(buf.length / 1000)} KB)`); continue; }
    try {
      const url = await unggah(buf, u.name);
      await sql`UPDATE users SET photo_url = ${url} WHERE id = ${u.id}`;
      tersimpan++;
      console.log(`+  ${u.name}: foto disimpan`);
    } catch (e) { console.log(`!  ${u.name}: gagal (${(e as Error).message})`); }
  }
  console.log(`\nRingkasan: ${ada} punya foto, ${tanpa} tanpa foto, ${dilewati} dilewati${terapkan ? `, ${tersimpan} tersimpan` : ""}.`);
  if (!terapkan && ada > 0) console.log("Untuk menyimpan: tambahkan --terapkan");
}
main().catch((e) => { console.error(e); process.exit(1); });

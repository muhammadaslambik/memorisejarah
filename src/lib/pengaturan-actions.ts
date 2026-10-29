// PAKET-3C2: aksi server untuk pengaturan tampilan situs (admin dan editor)
"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireReviewer } from "./auth";
import { AGENDA } from "./agenda";
import { INFORMASI_FIELDS, setSetting, type OverrideAgenda } from "./pengaturan";

const teks = (fd: FormData, k: string, maks = 600) => String(fd.get(k) ?? "").trim().slice(0, maks);
const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 40);

export async function saveAgenda(fd: FormData) {
  await requireReviewer();
  const ov: OverrideAgenda = {};
  for (const a of AGENDA) {
    ov[a.slug] = {
      nama: teks(fd, `nama_${a.slug}`, 120),
      sub: teks(fd, `sub_${a.slug}`, 80),
      emoji: teks(fd, `emoji_${a.slug}`, 8),
      deskripsi: teks(fd, `deskripsi_${a.slug}`, 800),
      jadwal: teks(fd, `jadwal_${a.slug}`, 200),
    };
  }
  await setSetting("agenda", ov);
  revalidatePath("/", "layout");
  redirect("/admin/agenda?ok=1");
}

export async function saveInformasi(fd: FormData) {
  await requireReviewer();
  const hasil: Record<string, Record<string, string>> = {};
  for (const g of INFORMASI_FIELDS) {
    hasil[g.grup] = {};
    for (const f of g.fields) hasil[g.grup][f.key] = teks(fd, `${g.grup}__${f.key}`, 800);
  }
  await setSetting("informasi", hasil);
  revalidatePath("/", "layout");
  redirect("/admin/informasi?ok=1");
}

const ambilIdDrive = (s: string): string | null => {
  const x = s.trim();
  if (/^[A-Za-z0-9_-]{10,}$/.test(x)) return x;
  const m = x.match(/folders\/([A-Za-z0-9_-]{10,})/) ?? x.match(/[?&]id=([A-Za-z0-9_-]{10,})/);
  return m ? m[1] : null;
};

export async function savePustaka(fd: FormData) {
  await requireReviewer();
  const daftar: { kunci: string; nama: string; id: string; ket: string }[] = [];
  const dipakai = new Set<string>();
  for (let i = 0; i < 8; i++) {
    const nama = teks(fd, `nama_${i}`, 80);
    const id = ambilIdDrive(teks(fd, `url_${i}`, 300));
    if (!nama || !id) continue;
    let kunci = slugify(nama) || `folder-${i}`;
    while (dipakai.has(kunci)) kunci += "-" + i;
    dipakai.add(kunci);
    daftar.push({ kunci, nama, id, ket: teks(fd, `ket_${i}`, 160) });
  }
  await setSetting("pustaka", daftar);
  revalidatePath("/", "layout");
  redirect("/admin/pustaka?ok=1");
}
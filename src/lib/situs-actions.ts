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
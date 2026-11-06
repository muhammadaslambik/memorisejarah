// PAKET-14C: terjemahan judul dan ringkasan artikel, hanya saat tombol ditekan, dengan tombol kembali ke teks asli.
// Slug tidak ikut berubah: bila masih kosong, slug dikunci dari judul ASLI sebelum judul diterjemahkan.
"use client";
import { useEffect, useRef, useState } from "react";
import { BAHASA_CMS, cariBahasa } from "@/lib/bahasa";
import { namaMesinTerakhir, terjemahkanDaftar } from "@/lib/terjemah";

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

export function TerjemahJudul() {
  const akar = useRef<HTMLDivElement>(null);
  const asli = useRef<{ judul: string; ringkasan: string } | null>(null);
  const [bahasa, setBahasa] = useState("en");
  const [sibuk, setSibuk] = useState(false);
  const [pesan, setPesan] = useState("");
  const [aktif, setAktif] = useState<string | null>(null);

  const kolom = () => {
    const f = akar.current?.closest("form");
    return {
      form: f,
      judul: f?.elements.namedItem("title") as HTMLInputElement | null,
      ringkasan: f?.elements.namedItem("excerpt") as HTMLTextAreaElement | null,
      slug: f?.elements.namedItem("slug") as HTMLInputElement | null,
    };
  };

  // Mencegah terjemahan judul/ringkasan tersimpan tanpa sengaja
  useEffect(() => {
    const form = akar.current?.closest("form");
    if (!form || !aktif) return;
    const onSubmit = (e: SubmitEvent) => {
      if (e.defaultPrevented) return;
      if (!window.confirm("Judul/ringkasan masih berupa terjemahan. Tetap simpan terjemahan ini?\n\nPilih Batal untuk kembali; gunakan \"Kembali ke bahasa asli\" bila perlu.")) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    };
    form.addEventListener("submit", onSubmit);
    return () => form.removeEventListener("submit", onSubmit);
  }, [aktif]);

  const terjemahkan = async () => {
    const { judul, ringkasan, slug } = kolom();
    if (!judul || !ringkasan || sibuk) return;
    const j = judul.value.trim();
    const r = ringkasan.value.replace(/\s*\n\s*/g, " ").trim();
    const items = [j, r].filter(Boolean);
    if (items.length === 0) { setPesan("Judul dan ringkasan masih kosong."); return; }
    setSibuk(true);
    setPesan("Menerjemahkan...");
    try {
      const hasil = await terjemahkanDaftar(items, bahasa, undefined, aktif ?? "id");
      if ("galat" in hasil) { setPesan(hasil.galat + " Teks tidak diubah."); return; }
      if (!asli.current) asli.current = { judul: judul.value, ringkasan: ringkasan.value };
      if (slug && !slug.value.trim()) slug.value = slugify(asli.current.judul); // slug tetap mengikuti judul asli
      let i = 0;
      if (j) judul.value = hasil[i++];
      if (r) ringkasan.value = hasil[i++];
      setAktif(bahasa);
      setPesan(`Selesai diterjemahkan ke ${cariBahasa(bahasa).nama} (${namaMesinTerakhir()}). Slug tidak berubah.`);
    } catch {
      setPesan("Terjemahan gagal. Teks tidak diubah.");
    } finally {
      setSibuk(false);
    }
  };

  const kembali = () => {
    const { judul, ringkasan } = kolom();
    if (!judul || !ringkasan || !asli.current) return;
    judul.value = asli.current.judul;
    ringkasan.value = asli.current.ringkasan;
    asli.current = null;
    setAktif(null);
    setPesan("Judul dan ringkasan dikembalikan ke teks asli.");
  };

  return (
    <div ref={akar} className="flex flex-wrap items-center gap-2 text-sm">
      <span className="opacity-70">Terjemahkan judul dan ringkasan:</span>
      <select value={bahasa} onChange={(e) => setBahasa(e.target.value)} aria-label="Bahasa tujuan" className="rounded border p-1.5 notranslate">
        {BAHASA_CMS.map((b) => <option key={b.kode} value={b.kode}>{b.nama}</option>)}
      </select>
      <button type="button" onClick={terjemahkan} disabled={sibuk} className="a-btn-soft">{sibuk ? "Menerjemahkan..." : "Terjemahkan"}</button>
      <button type="button" onClick={kembali} disabled={!aktif || sibuk} className="a-btn-soft">Kembali ke bahasa asli</button>
      {pesan && <span className="w-full text-xs opacity-80" role="status">{pesan}</span>}
    </div>
  );
}

// PAKET-15C: foto akun di halaman Akun Saya. Gambar dipotong persegi dan dikecilkan (512 px, WebP) di perangkat sebelum diunggah.
"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { hapusFotoAkun, simpanFotoAkun } from "@/lib/account-actions";

async function potongPersegi(f: File, sisi = 512): Promise<File> {
  const bmp = await createImageBitmap(f);
  const s = Math.min(bmp.width, bmp.height);
  const c = document.createElement("canvas");
  c.width = c.height = sisi;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("kanvas");
  ctx.drawImage(bmp, (bmp.width - s) / 2, (bmp.height - s) / 2, s, s, 0, 0, sisi, sisi);
  const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/webp", 0.86));
  if (!blob) throw new Error("webp");
  return new File([blob], "foto.webp", { type: "image/webp" });
}

export function FotoAkun({ foto, inisial, nama }: { foto: string | null; inisial: string; nama: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [baru, setBaru] = useState<{ berkas: File; url: string } | null>(null);
  const [pesan, setPesan] = useState("");
  const [sibuk, mulai] = useTransition();

  useEffect(() => () => { if (baru) URL.revokeObjectURL(baru.url); }, [baru]);

  const pilih = async (f?: File) => {
    setPesan("");
    if (!f) return;
    if (!f.type.startsWith("image/")) { setPesan("Pilih berkas gambar (JPG, PNG, WEBP, atau GIF)."); return; }
    try {
      const k = await potongPersegi(f);
      setBaru({ berkas: k, url: URL.createObjectURL(k) });
    } catch { setPesan("Gambar tidak dapat dibaca. Coba berkas lain."); }
  };
  const simpan = () => {
    if (!baru) return;
    const fd = new FormData();
    fd.set("foto", baru.berkas);
    mulai(async () => { await simpanFotoAkun(fd); });
  };
  const tampil = baru?.url ?? foto;

  return (
    <section className="mt-6 space-y-3 rounded bg-white/70 p-5">
      <h2 className="font-medium">Foto profil</h2>
      <div className="flex flex-wrap items-center gap-4">
        <span className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#d9a441] to-[#a8691b] text-2xl font-bold text-[#1b1108]" aria-label={`Foto ${nama}`}>
          {tampil ? <img src={tampil} alt="" className="h-full w-full object-cover" /> : inisial}
        </span>
        <div className="space-y-2 text-sm">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => input.current?.click()} className="a-btn-soft !px-3 !py-1.5" disabled={sibuk}>Pilih foto</button>
            {baru && <button type="button" onClick={simpan} disabled={sibuk} className="rounded bg-gold px-4 py-1.5 text-white disabled:opacity-60">{sibuk ? "Menyimpan..." : "Simpan foto"}</button>}
            {baru && <button type="button" onClick={() => setBaru(null)} disabled={sibuk} className="a-btn-soft !px-3 !py-1.5">Batal</button>}
            {foto && !baru && (
              <button type="button" disabled={sibuk} onClick={() => { if (confirm("Hapus foto profil?")) mulai(async () => { await hapusFotoAkun(); }); }} className="a-btn-soft !px-3 !py-1.5 text-red-700">Hapus foto</button>
            )}
          </div>
          <p className="a-muted text-xs">Foto dipotong persegi di tengah dan dikecilkan otomatis. Foto ini tampil di CMS dan di header situs.</p>
          {pesan && <p className="text-xs text-red-700">{pesan}</p>}
        </div>
        <input ref={input} type="file" accept="image/*" className="sr-only" onChange={(e) => { void pilih(e.target.files?.[0]); e.target.value = ""; }} />
      </div>
    </section>
  );
}

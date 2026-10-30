// PAKET-4B
"use client";
import { useState } from "react";

export function PilihSumberGambar({ defaultUrl, baru, siap }: { defaultUrl?: string; baru: boolean; siap: boolean }) {
  const [mode, setMode] = useState<"url" | "berkas">("url");
  const input = "mt-1 w-full rounded border p-2";
  return (
    <fieldset className="text-sm">
      <legend>Sumber gambar</legend>
      <div className="mt-2 flex flex-wrap gap-5">
        <label className="flex items-center gap-2">
          <input type="radio" name="sumber" value="url" checked={mode === "url"} onChange={() => setMode("url")} /> Tautan gambar (URL)
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="sumber" value="berkas" checked={mode === "berkas"} onChange={() => setMode("berkas")} /> Kirim berkas dari perangkat
        </label>
      </div>
      {mode === "url" ? (
        <label className="mt-3 block">Alamat gambar (tautan https langsung ke berkas gambar)
          <input name="url" required={baru} defaultValue={defaultUrl} placeholder="https://..." className={input} />
        </label>
      ) : (
        <div className="mt-3">
          <label className="block">Berkas gambar (JPG, PNG, WEBP, atau GIF; maksimal 10 MB){!baru && " - kosongkan bila tidak ingin mengganti gambar"}
            <input type="file" name="berkas" required={baru} accept="image/jpeg,image/png,image/webp,image/gif" className={input} />
          </label>
          {!siap && (
            <p className="mt-2 rounded bg-amber-50 p-2 text-amber-800">Penyimpanan ImageKit belum disiapkan (kunci IMAGEKIT_PRIVATE_KEY belum diisi), sehingga unggah berkas akan ditolak. Gunakan tautan dulu.</p>
          )}
        </div>
      )}
    </fieldset>
  );
}
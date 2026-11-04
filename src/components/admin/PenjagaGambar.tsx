// PAKET-13B: dialog konfirmasi saat gambar dilepas dari artikel.
// Pilihan: lepas dari artikel ini saja (berkas tetap di galeri/ImageKit), atau hapus juga dari ImageKit
// (hanya untuk gambar yang tidak dipakai artikel lain atau bagian situs lain).
"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { periksaGambarDihapus } from "@/lib/gambar-hapus-actions";
import { tanpaQuery, urlIKDi } from "@/lib/gambar-klien";
import { kecil } from "@/lib/gambar-url";

type Rincian = { url: string; nama: string; dipakaiDi: { id: number; title: string }[]; lainnya: boolean };

export function PenjagaGambar({ postId, awal }: { postId: number | null; awal: string[] }) {
  const masuk = useRef<HTMLInputElement>(null);
  const lewat = useRef(false);
  const pengirim = useRef<HTMLElement | null>(null);
  const [daftar, setDaftar] = useState<Rincian[] | null>(null);
  const awalIK = useMemo(
    () => [...new Set(awal.map(tanpaQuery))].filter((u) => /^https:\/\/ik\.imagekit\.io\//i.test(u)),
    [awal],
  );

  useEffect(() => {
    const form = masuk.current?.form;
    if (!form || awalIK.length === 0) return;
    const kirimLagi = () => {
      lewat.current = true;
      if (pengirim.current && pengirim.current.isConnected) form.requestSubmit(pengirim.current as HTMLButtonElement);
      else form.requestSubmit();
    };
    const onSubmit = async (e: SubmitEvent) => {
      if (lewat.current) { lewat.current = false; return; }
      const isi = (form.elements.namedItem("content") as HTMLInputElement | null)?.value ?? "";
      const sampul = (form.elements.namedItem("coverUrl") as HTMLInputElement | null)?.value ?? "";
      const sekarang = new Set([...urlIKDi(isi), tanpaQuery(sampul)]);
      const hilang = awalIK.filter((u) => !sekarang.has(u));
      if (hilang.length === 0) return;
      e.preventDefault(); // tahan dulu; ditanyakan ke pengguna
      pengirim.current = e.submitter;
      const r = await periksaGambarDihapus(postId, hilang);
      if (r.length === 0) { kirimLagi(); return; }
      setDaftar(r);
    };
    form.addEventListener("submit", onSubmit);
    return () => form.removeEventListener("submit", onSubmit);
  }, [awalIK, postId]);

  const lanjut = (hapusDariImageKit: boolean) => {
    const bisa = (daftar ?? []).filter((r) => r.dipakaiDi.length === 0 && !r.lainnya).map((r) => r.url);
    if (masuk.current) masuk.current.value = JSON.stringify(hapusDariImageKit ? bisa : []);
    setDaftar(null);
    const form = masuk.current?.form;
    if (!form) return;
    lewat.current = true;
    if (pengirim.current && pengirim.current.isConnected) form.requestSubmit(pengirim.current as HTMLButtonElement);
    else form.requestSubmit();
  };

  const bolehHapus = (daftar ?? []).filter((r) => r.dipakaiDi.length === 0 && !r.lainnya).length;
  return (
    <>
      <input ref={masuk} type="hidden" name="hapusIK" defaultValue="[]" />
      {daftar && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" role="alertdialog" aria-modal="true" aria-label="Konfirmasi hapus gambar">
          <div className="a-card flex max-h-[88vh] w-full max-w-xl flex-col p-5 shadow-2xl">
            <h2 className="text-lg font-semibold">Gambar dilepas dari artikel</h2>
            <p className="mt-1 text-sm opacity-80">
              {daftar.length} gambar tidak lagi ada di artikel ini. Pilih apa yang dilakukan dengan berkasnya.
            </p>
            <ul className="mt-3 flex-1 space-y-2 overflow-y-auto">
              {daftar.map((r) => {
                const dipakai = r.dipakaiDi.length > 0 || r.lainnya;
                return (
                  <li key={r.url} className="flex gap-3 rounded border p-2 text-sm">
                    <img src={kecil(r.url, 160)} alt="" className="h-14 w-20 shrink-0 rounded object-cover" />
                    <div className="min-w-0">
                      <p className="truncate font-medium" title={r.nama}>{r.nama}</p>
                      {dipakai ? (
                        <p className="text-xs opacity-80">
                          Masih dipakai di {r.dipakaiDi.length > 0 ? r.dipakaiDi.map((p) => p.title).join(", ") : "bagian situs lain"}
                          {" "}— berkas dipertahankan.
                        </p>
                      ) : (
                        <p className="text-xs opacity-80">Tidak dipakai di tempat lain.</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button type="button" className="a-btn-soft" onClick={() => setDaftar(null)}>Batal, kembali menyunting</button>
              <button type="button" className="a-btn-soft" onClick={() => lanjut(false)}>Lepas dari artikel ini saja</button>
              {bolehHapus > 0 && (
                <button type="button" className="rounded-full bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800" onClick={() => lanjut(true)}>
                  Hapus juga dari ImageKit ({bolehHapus})
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

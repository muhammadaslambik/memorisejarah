// PAKET-13C: alat bahasa di bilah alat editor CMS. Semuanya hanya bekerja saat tombolnya ditekan:
//  - pilih bahasa tulisan (menentukan bahasa pemeriksa ejaan dan bahasa tujuan terjemahan)
//  - Periksa ejaan: menyalakan garis merah pemeriksa ejaan peramban untuk bahasa terpilih
//  - Terjemahkan: menerjemahkan seluruh teks (atau bagian yang diblok), tanpa menyimpan apa pun di database
//  - Kembali ke bahasa asli: mengembalikan teks sebelum diterjemahkan
"use client";
import { useEffect, useRef, useState } from "react";
import type { Editor as TipTapEditor } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";
import { BAHASA_CMS, cariBahasa } from "@/lib/bahasa";
import { terjemahkanDaftar } from "@/lib/terjemah";
import { kumpulkanTeks, terapkanTerjemahan } from "@/lib/terjemah-editor";

type Props = {
  editor: TipTapEditor | null;
  bahasa: string;
  setBahasa: (kode: string) => void;
  ejaan: boolean;
  setEjaan: (v: boolean) => void;
};

export function AlatBahasa({ editor, bahasa, setBahasa, ejaan, setEjaan }: Props) {
  const akar = useRef<HTMLDivElement>(null);
  const asli = useRef<{ json: JSONContent; bahasa: string } | null>(null);
  const [buka, setBuka] = useState(false);
  const [sibuk, setSibuk] = useState(false);
  const [pesan, setPesan] = useState("");
  const [aktif, setAktif] = useState<string | null>(null); // kode bahasa terjemahan yang sedang tampil di editor
  const b = cariBahasa(bahasa);

  useEffect(() => {
    if (!buka) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setBuka(false); };
    const luar = (e: MouseEvent) => { if (!akar.current?.contains(e.target as Node)) setBuka(false); };
    document.addEventListener("keydown", esc);
    document.addEventListener("mousedown", luar);
    return () => { document.removeEventListener("keydown", esc); document.removeEventListener("mousedown", luar); };
  }, [buka]);

  // Mencegah terjemahan tersimpan tanpa sengaja
  useEffect(() => {
    const form = akar.current?.closest("form");
    if (!form || !aktif) return;
    const onSubmit = (e: SubmitEvent) => {
      if (e.defaultPrevented) return;
      if (!window.confirm("Teks di editor masih berupa terjemahan. Tetap simpan terjemahan ini?\n\nPilih Batal untuk kembali; gunakan \"Kembali ke bahasa asli\" bila perlu.")) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    };
    form.addEventListener("submit", onSubmit);
    return () => form.removeEventListener("submit", onSubmit);
  }, [aktif]);

  const terjemahkan = async () => {
    if (!editor || sibuk) return;
    const { from, to, empty } = editor.state.selection;
    const potongan = kumpulkanTeks(editor.state.doc, empty ? 0 : from, empty ? editor.state.doc.content.size : to);
    if (potongan.length === 0) { setPesan("Tidak ada teks yang bisa diterjemahkan."); return; }
    setSibuk(true);
    setPesan("Menerjemahkan...");
    editor.setEditable(false); // kunci sementara agar posisi teks tidak bergeser
    try {
      const hasil = await terjemahkanDaftar(potongan.map((p) => p.inti), b.kode, (s, t) => setPesan(`Menerjemahkan... ${s}/${t}`));
      if ("galat" in hasil) { setPesan(hasil.galat + " Teks tidak diubah."); return; }
      if (!asli.current) asli.current = { json: editor.getJSON(), bahasa };
      const tr = editor.state.tr;
      terapkanTerjemahan(tr, potongan, hasil);
      editor.view.dispatch(tr);
      setAktif(b.kode);
      setPesan(`Selesai: ${empty ? "seluruh teks" : "bagian terpilih"} diterjemahkan ke ${b.nama}. Gunakan "Kembali ke bahasa asli" untuk membatalkan.`);
    } catch {
      setPesan("Terjemahan gagal. Teks tidak diubah.");
    } finally {
      editor.setEditable(true);
      setSibuk(false);
    }
  };

  const kembaliAsli = () => {
    if (!editor || !asli.current || sibuk) return;
    if (!window.confirm("Kembalikan teks ke bahasa aslinya? Perubahan yang dibuat setelah menerjemahkan akan hilang.")) return;
    editor.commands.setContent(asli.current.json, true);
    setBahasa(asli.current.bahasa);
    asli.current = null;
    setAktif(null);
    setPesan("Teks dikembalikan ke bahasa asli.");
  };

  const g = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  const tombol = "w-full rounded-md border px-3 py-1.5 text-left text-sm transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50";
  return (
    <div ref={akar} className="relative inline-block">
      <button
        type="button"
        onClick={() => setBuka(!buka)}
        aria-expanded={buka}
        aria-label="Alat bahasa"
        title="Alat bahasa: periksa ejaan dan terjemahan"
        className={`flex items-center gap-1 rounded px-2 py-1 text-sm hover:bg-black/10 ${aktif || ejaan ? "bg-black/10 font-semibold" : ""}`}
      >
        <svg {...g} className="h-4 w-4" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" />
        </svg>
        <span className="uppercase">{(aktif ?? bahasa).split("-")[0]}</span>
      </button>
      {buka && (
        <div className="a-card absolute left-0 top-full z-50 mt-1 w-80 max-w-[85vw] p-3 text-sm shadow-2xl" role="dialog" aria-label="Alat bahasa">
          <p className="mb-1 font-medium">Bahasa tulisan</p>
          <div className="grid grid-cols-2 gap-1 notranslate">
            {BAHASA_CMS.map((x) => (
              <button
                key={x.kode}
                type="button"
                onClick={() => { setBahasa(x.kode); setPesan(""); }}
                aria-pressed={x.kode === bahasa}
                className={`rounded-md border px-2 py-1 text-left text-xs transition hover:bg-black/5 ${x.kode === bahasa ? "border-current font-semibold" : ""}`}
              >
                {x.nama}
              </button>
            ))}
          </div>

          <div className="mt-3 space-y-2">
            <button type="button" className={`${tombol} ${ejaan ? "font-semibold" : ""}`} aria-pressed={ejaan} onClick={() => setEjaan(!ejaan)}>
              {ejaan ? "Matikan" : "Nyalakan"} pemeriksa ejaan ({b.nama})
            </button>
            <p className="text-xs opacity-70">Garis merah memakai kamus bahasa di peramban. Tambahkan bahasanya di pengaturan peramban (Bahasa, Pemeriksa ejaan). Jawa dan Sunda umumnya belum tersedia.</p>

            <button type="button" className={tombol} disabled={sibuk || !editor} onClick={terjemahkan}>
              {sibuk ? "Menerjemahkan..." : `Terjemahkan ke ${b.nama}`}
            </button>
            <p className="text-xs opacity-70">Menerjemahkan seluruh teks, atau hanya bagian yang diblok. Hanya berjalan saat tombol ini ditekan.</p>

            <button type="button" className={tombol} disabled={!asli.current || sibuk} onClick={kembaliAsli}>
              Kembali ke bahasa asli
            </button>
          </div>
          {pesan && <p className="mt-2 rounded bg-amber-50 px-2 py-1.5 text-xs text-amber-900" role="status">{pesan}</p>}
        </div>
      )}
    </div>
  );
}

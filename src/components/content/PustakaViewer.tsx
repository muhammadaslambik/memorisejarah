// PAKET-3A: folder Google Drive ditampilkan langsung di dalam situs
// PAKET-32: penjelajah folder buatan sendiri (warna situs, buka folder dan berkas tanpa tab baru). Tanpa kunci Drive API, kembali ke embed Google (cadangan).
"use client";
import { useEffect, useRef, useState } from "react";

type F = { kunci: string; nama: string; id: string; url: string };
type Fol = { id: string; nama: string; t: string };
type Ber = { id: string; nama: string; mime: string; thumb: string; ukuran: number; diubah: string };
type Isi = { folders: Fol[]; berkas: Ber[] };
type Langkah = { id: string; t: string; nama: string };

const IKON_TIPE: [RegExp, string, string][] = [
  [/pdf/, "PDF", "bg-red-900/70 text-red-100"],
  [/word|document|msword|opendocument\.text/, "DOC", "bg-blue-900/70 text-blue-100"],
  [/sheet|excel|csv/, "XLS", "bg-green-900/70 text-green-100"],
  [/presentation|powerpoint/, "PPT", "bg-orange-900/70 text-orange-100"],
  [/^image\//, "GAMBAR", "bg-purple-900/70 text-purple-100"],
  [/^video\//, "VIDEO", "bg-pink-900/70 text-pink-100"],
  [/^audio\//, "AUDIO", "bg-teal-900/70 text-teal-100"],
  [/zip|rar|compressed/, "ZIP", "bg-stone-700 text-stone-100"],
  [/^text\//, "TEKS", "bg-stone-700 text-stone-100"],
];
const jenis = (b: Ber) => {
  for (const [re, label, kelas] of IKON_TIPE) if (re.test(b.mime)) return { label, kelas };
  const e = b.nama.includes(".") ? b.nama.split(".").pop()!.toUpperCase().slice(0, 5) : "";
  return { label: e || "BERKAS", kelas: "bg-stone-700 text-stone-100" };
};
const urlPratinjau = (b: Ber) =>
  b.mime === "application/vnd.google-apps.document" ? `https://docs.google.com/document/d/${b.id}/preview`
  : b.mime === "application/vnd.google-apps.spreadsheet" ? `https://docs.google.com/spreadsheets/d/${b.id}/preview`
  : b.mime === "application/vnd.google-apps.presentation" ? `https://docs.google.com/presentation/d/${b.id}/preview`
  : `https://drive.google.com/file/d/${b.id}/preview`;
const bisaUnduh = (b: Ber) => !b.mime.startsWith("application/vnd.google-apps.");
const ukuranTeks = (n: number) => (n <= 0 ? "" : n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1).replace(".", ",")} MB`);
const tanggal = (s: string) => { const d = new Date(s); return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }); };

export function PustakaViewer({ folders, awal, drive }: { folders: F[]; awal: string; drive: boolean }) {
  const [k, setK] = useState(folders.some((f) => f.kunci === awal) ? awal : folders[0].kunci);
  const f = folders.find((x) => x.kunci === k) ?? folders[0];
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {folders.map((x) => (
          <button
            key={x.kunci} type="button" onClick={() => setK(x.kunci)}
            className={`rounded-full border px-4 py-2 text-sm transition ${x.kunci === k ? "border-ms-gold bg-ms-gold font-semibold text-ms-bg" : "border-ms-line text-ms-cream/80 hover:border-ms-gold hover:text-ms-gold"}`}
          >
            {x.nama}
          </button>
        ))}
      </div>
      {drive ? <Jelajah key={f.kunci} akar={f} /> : <Embed f={f} />}
    </div>
  );
}

// Cadangan bila kunci Drive API belum diatur: embed Google. Warna latar putihnya dibalik agar mengikuti warna situs (isi iframe milik Google, tidak bisa diatur langsung).
function Embed({ f }: { f: F }) {
  return (
    <>
      <div className="isolate mt-5 overflow-hidden rounded-2xl border border-ms-line bg-ms-bg">
        <iframe key={f.kunci} src={`https://drive.google.com/embeddedfolderview?id=${f.id}#grid`} title={f.nama} loading="lazy" className="h-[640px] w-full" style={{ filter: "invert(1) hue-rotate(180deg)", mixBlendMode: "screen", colorScheme: "light" }} />
      </div>
      <a href={f.url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-sm text-ms-gold">Buka folder ini di Google Drive &rarr;</a>
    </>
  );
}

const IkonFolder = () => (
  <svg viewBox="0 0 24 24" className="h-10 w-10 shrink-0 text-ms-gold" fill="currentColor" aria-hidden><path d="M10 4l2 2h8a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z" opacity=".9" /></svg>
);

function Jelajah({ akar }: { akar: F }) {
  const [jejak, setJejak] = useState<Langkah[]>([{ id: akar.id, t: "", nama: akar.nama }]);
  const [isi, setIsi] = useState<Isi | null>(null);
  const [galat, setGalat] = useState("");
  const [cari, setCari] = useState("");
  const [buka, setBuka] = useState<Ber | null>(null);
  const [ulang, setUlang] = useState(0);
  const simpan = useRef(new Map<string, Isi>());
  const kini = jejak[jejak.length - 1];

  useEffect(() => {
    let batal = false;
    setGalat(""); setCari("");
    const ada = simpan.current.get(kini.id);
    if (ada) { setIsi(ada); return; }
    setIsi(null);
    fetch(`/api/pustaka?k=${encodeURIComponent(akar.kunci)}&d=${encodeURIComponent(kini.id)}&t=${encodeURIComponent(kini.t)}`)
      .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json() as Promise<Isi>; })
      .then((d) => { if (batal) return; simpan.current.set(kini.id, d); setIsi(d); })
      .catch(() => { if (!batal) setGalat("Folder belum dapat dimuat. Periksa sambungan Anda lalu coba lagi."); });
    return () => { batal = true; };
  }, [akar.kunci, kini.id, kini.t, ulang]);

  useEffect(() => {
    if (!buka) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setBuka(null); };
    window.addEventListener("keydown", esc);
    const awal = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", esc); document.body.style.overflow = awal; };
  }, [buka]);

  const q = cari.trim().toLowerCase();
  const fol = (isi?.folders ?? []).filter((x) => !q || x.nama.toLowerCase().includes(q));
  const ber = (isi?.berkas ?? []).filter((x) => !q || x.nama.toLowerCase().includes(q));
  const masuk = (x: Fol) => setJejak((j) => [...j, { id: x.id, t: x.t, nama: x.nama }]);

  return (
    <div className="mt-5">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
        <nav aria-label="Jejak folder" className="flex min-w-0 flex-1 flex-wrap items-center gap-1 text-sm">
          {jejak.map((l, i) => (
            <span key={l.id} className="flex min-w-0 items-center gap-1">
              {i > 0 && <span className="text-ms-cream/40">/</span>}
              {i === jejak.length - 1
                ? <span className="max-w-[16rem] truncate font-semibold text-ms-gold">{l.nama}</span>
                : <button type="button" onClick={() => setJejak((j) => j.slice(0, i + 1))} className="max-w-[12rem] truncate text-ms-cream/70 hover:text-ms-gold">{l.nama}</button>}
            </span>
          ))}
        </nav>
        {jejak.length > 1 && <button type="button" onClick={() => setJejak((j) => j.slice(0, -1))} className="rounded-full border border-ms-line px-3 py-1.5 text-xs text-ms-cream/80 hover:border-ms-gold hover:text-ms-gold">&larr; Kembali</button>}
        <input value={cari} onChange={(e) => setCari(e.target.value)} placeholder="Cari di folder ini…" aria-label="Cari di folder ini" className="w-full rounded-full border border-ms-line bg-ms-surface px-4 py-1.5 text-sm text-ms-cream placeholder:text-ms-cream/40 focus:border-ms-gold focus:outline-none sm:w-60" />
      </div>

      <div className="mt-4 rounded-2xl border border-ms-line bg-ms-bg p-3 sm:p-4">
        {galat ? (
          <div className="py-12 text-center text-sm text-ms-cream/70">{galat}<br /><button type="button" onClick={() => setUlang((n) => n + 1)} className="mt-3 rounded-full border border-ms-gold px-4 py-1.5 text-ms-gold">Coba lagi</button></div>
        ) : !isi ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-6" aria-busy>
            {Array.from({ length: 12 }, (_, i) => <div key={i} className="h-36 animate-pulse rounded-xl border border-ms-line bg-ms-surface" />)}
          </div>
        ) : fol.length + ber.length === 0 ? (
          <p className="py-12 text-center text-sm text-ms-cream/60">{q ? "Tidak ada yang cocok dengan pencarian." : "Folder ini masih kosong."}</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-6">
            {fol.map((x) => (
              <button key={x.id} type="button" onClick={() => masuk(x)} title={x.nama} className="flex h-36 flex-col items-start justify-between rounded-xl border border-ms-line bg-ms-surface p-3 text-left transition hover:border-ms-gold">
                <IkonFolder />
                <span className="line-clamp-2 text-sm font-medium text-ms-cream">{x.nama}</span>
              </button>
            ))}
            {ber.map((x) => {
              const j = jenis(x);
              return (
                <button key={x.id} type="button" onClick={() => setBuka(x)} title={x.nama} className="group/b flex h-36 flex-col overflow-hidden rounded-xl border border-ms-line bg-ms-surface text-left transition hover:border-ms-gold">
                  <div className="relative h-20 w-full shrink-0 bg-black/30">
                    {x.thumb
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={x.thumb.replace(/=s\d+$/, "=s400")} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                      : <span className="grid h-full w-full place-items-center text-ms-cream/30"><svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden><path d="M6 3h8l5 5v13H6zM14 3v5h5" /></svg></span>}
                    <span className={`absolute left-1.5 top-1.5 rounded px-1.5 py-0.5 text-[10px] font-bold ${j.kelas}`}>{j.label}</span>
                  </div>
                  <div className="flex min-h-0 flex-1 flex-col justify-between p-2">
                    <span className="line-clamp-2 text-xs font-medium leading-snug text-ms-cream">{x.nama}</span>
                    <span className="truncate text-[10px] text-ms-cream/50">{[ukuranTeks(x.ukuran), tanggal(x.diubah)].filter(Boolean).join(" • ")}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {buka && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-2 sm:p-6" role="dialog" aria-modal="true" aria-label={buka.nama} onClick={(e) => { if (e.target === e.currentTarget) setBuka(null); }}>
          <div className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-ms-line bg-ms-bg">
            <div className="flex items-center gap-2 border-b border-ms-line px-3 py-2">
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ms-cream">{buka.nama}</span>
              {bisaUnduh(buka) && <a href={`https://drive.google.com/uc?export=download&id=${buka.id}`} className="rounded-full border border-ms-line px-3 py-1.5 text-xs text-ms-cream/80 hover:border-ms-gold hover:text-ms-gold">Unduh</a>}
              <button type="button" onClick={() => setBuka(null)} className="rounded-full bg-ms-gold px-3 py-1.5 text-xs font-semibold text-ms-bg">Tutup</button>
            </div>
            <iframe key={buka.id} src={urlPratinjau(buka)} title={buka.nama} className="min-h-0 w-full flex-1 bg-black" allow="autoplay; fullscreen" />
          </div>
        </div>
      )}
    </div>
  );
}

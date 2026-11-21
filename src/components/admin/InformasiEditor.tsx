// PAKET-19/21: editor Informasi Pilihan bergaya "pengaturan halaman" WordPress. Kanvas = tampilan situs yang SAMA PERSIS (komponen InformasiTampilan, huruf dan warna sama);
// teks diketik langsung di tempatnya. "Edit tata letak": pilih blok lalu atur urutan (seret/panah), lebar dan tinggi (tarik sudut), bentuk, latar, warna/jenis/ukuran teks, animasi.
"use client";
import Link from "next/link";
import { useRef, useState, type CSSProperties } from "react";
import { INFORMASI_FIELDS, type Informasi } from "@/lib/pengaturan";
import { InformasiTampilan, type Bungkus, type Isi, type IsiK, type Tombol, type TombolK } from "@/components/home/InformasiTampilan";
import { ANIMASI, BLOK_IDS, LATAR, MAKS_KUSTOM, MODEL_KUSTOM, adaKustom, gayaBawaan, gayaKustom, idKustom, idTampil, namaBlok, tataBawaan, type BlokId, type BlokKustom, type GayaBlok, type ModelKustom, type TataInformasi } from "@/lib/informasi-tata";

const jepit = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));
const LEBAR_PILIHAN: [number, string][] = [[3, "3 kolom (¼)"], [4, "4 kolom (⅓)"], [5, "5 kolom"], [6, "6 kolom (½)"], [7, "7 kolom"], [8, "8 kolom (⅔)"], [9, "9 kolom (¾)"], [10, "10 kolom"], [11, "11 kolom"], [12, "12 kolom (penuh)"]];
const kecilIn = "w-full rounded border p-1.5 text-sm";
const adaBawaan = (id: string): id is BlokId => (BLOK_IDS as readonly string[]).includes(id);

export function InformasiEditor({ d, tata: awal, aksi }: { d: Informasi; tata: TataInformasi; aksi: (fd: FormData) => void | Promise<void> }) {
  const [tata, setTata] = useState<TataInformasi>(awal);
  const [mode, setMode] = useState<"teks" | "tata">("teks");
  const [terpilih, setTerpilih] = useState<string>("merah");
  const [seret, setSeret] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const ubah = useRef<{ id: string; x0: number; y0: number; lebar0: number; h0: number; kolom: number } | null>(null);

  const setGaya = (id: string, p: Partial<GayaBlok>) => setTata((t) => ({ ...t, gaya: { ...t.gaya, [id]: { ...t.gaya[id], ...p } } }));
  const pindah = (id: string, arah: -1 | 1) => setTata((t) => {
    const i = t.urutan.indexOf(id), j = i + arah;
    if (j < 0 || j >= t.urutan.length) return t;
    const u = [...t.urutan]; [u[i], u[j]] = [u[j], u[i]];
    return { ...t, urutan: u };
  });
  const taruh = (ke: string) => {
    if (!seret || seret === ke) return;
    setTata((t) => {
      const u = t.urutan.filter((x) => x !== seret);
      u.splice(t.urutan.indexOf(ke), 0, seret);
      return { ...t, urutan: u };
    });
    setSeret(null);
  };

  // PAKET-30: blok baru, hapus blok, pulihkan blok bawaan
  const setKustom = (id: string, p: Partial<BlokKustom>) => setTata((t) => ({ ...t, kustom: t.kustom.map((k) => (k.id === id ? { ...k, ...p } : k)) }));
  const tambah = (model: ModelKustom) => {
    if (tata.kustom.length >= MAKS_KUSTOM) return;
    const m = MODEL_KUSTOM.find((x) => x.id === model)!;
    const id = idKustom();
    setTata((t) => ({ ...t, urutan: [...t.urutan, id], kustom: [...t.kustom, { id, model, ...m.isi }], gaya: { ...t.gaya, [id]: gayaKustom(model) } }));
    setTerpilih(id);
  };
  const sisaSetelah = (t: TataInformasi, id: string) => idTampil(t, true).filter((x) => x !== id)[0] ?? "merah";
  const hapusBlok = (id: string) => {
    const nama = namaBlok(tata, id);
    if (!window.confirm(adaKustom(id) ? `Hapus blok "${nama}"? Isinya hilang setelah Anda menyimpan.` : `Hapus blok bawaan "${nama}" dari tampilan? Anda bisa memulihkannya kapan saja.`)) return;
    const baru: TataInformasi = adaKustom(id)
      ? { ...tata, urutan: tata.urutan.filter((x) => x !== id), kustom: tata.kustom.filter((k) => k.id !== id) }
      : { ...tata, dihapus: [...tata.dihapus, id as BlokId] };
    setTata(baru);
    setTerpilih(sisaSetelah(baru, id));
  };
  const pulihkan = (id: BlokId) => { setTata((t) => ({ ...t, dihapus: t.dihapus.filter((x) => x !== id) })); setTerpilih(id); };
  const kb = tata.kustom.find((k) => k.id === terpilih);

  const nilai = (g: keyof Informasi, k: string) => (d[g] as unknown as Record<string, string>)[k] ?? "";
  const isi: Isi = (g, k, o) => (
    <textarea name={`${g}__${k}`} defaultValue={nilai(g, k)} rows={1} maxLength={800} spellCheck={false} aria-label={`${g} ${k}`}
      title={o?.tebal ? "Gunakan **tebal** untuk huruf tebal" : undefined}
      className="block w-full resize-none [field-sizing:content]" />
  );
  const tombol: Tombol = (g, kelas, akhiran) => (
    <div className="mt-6">
      <span className={`${kelas} !mt-0`}>
        <input name={`${g}__tombol`} defaultValue={nilai(g, "tombol")} maxLength={800} aria-label={`${g} teks tombol`} className="w-32 text-center" />
        {akhiran}
      </span>
      <label className="mt-2 block text-[11px] opacity-70">
        Tautan tombol
        <input name={`${g}__href`} defaultValue={nilai(g, "href")} maxLength={800} placeholder="/artikel/slug atau https://..." className="info-tautan mt-0.5 block w-full" />
      </label>
    </div>
  );

  const isiK: IsiK = (b, k, o) => (
    <textarea value={b[k]} onChange={(e) => setKustom(b.id, { [k]: e.target.value })} rows={1} maxLength={k === "isi" ? 1500 : k === "label" ? 60 : 300} spellCheck={false} aria-label={`blok baru ${k}`}
      title={o?.tebal ? "Gunakan **tebal** untuk huruf tebal" : undefined} className="block w-full resize-none [field-sizing:content]" />
  );
  const tombolK: TombolK = (b, kelas) => (
    <span className={`${kelas} !mt-0`}>
      <input value={b.tombol} onChange={(e) => setKustom(b.id, { tombol: e.target.value })} maxLength={60} placeholder="Teks tombol" aria-label="blok baru teks tombol" className="w-32 text-center" />
    </span>
  );

  const aktif = mode === "tata";
  const mulaiUbah = (id: string) => (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation();
    const gw = gridRef.current?.getBoundingClientRect().width ?? 800;
    const h0 = e.currentTarget.parentElement?.getBoundingClientRect().height ?? 200;
    ubah.current = { id, x0: e.clientX, y0: e.clientY, lebar0: tata.gaya[id].lebar, h0, kolom: (gw + 24) / 12 };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const geserUbah = (e: React.PointerEvent<HTMLDivElement>) => {
    const u = ubah.current;
    if (!u) return;
    setGaya(u.id, { lebar: jepit(u.lebar0 + Math.round((e.clientX - u.x0) / u.kolom), 3, 12), tinggi: jepit(Math.round((u.h0 + e.clientY - u.y0) / 10) * 10, 0, 900) });
  };
  const selesaiUbah = (e: React.PointerEvent<HTMLDivElement>) => { ubah.current = null; if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId); };

  const bungkus: Bungkus = (id, node) => {
    const g = tata.gaya[id];
    const pilih = aktif && terpilih === id;
    return (
      <div
        key={id}
        className="ms-blok relative"
        style={{ "--span": g.lebar, opacity: g.sembunyi ? 0.45 : 1, outline: pilih ? "2px solid #f5b942" : aktif ? "1px dashed rgba(255,255,255,.4)" : "none", outlineOffset: 4 } as CSSProperties}
        onClickCapture={() => setTerpilih(id)}
        onDragOver={(e) => { if (seret) e.preventDefault(); }}
        onDrop={(e) => { e.preventDefault(); taruh(id); }}
      >
        {aktif && (
          <div className="absolute -top-3 left-3 z-20 flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-[11px] font-semibold text-black shadow">
            <span draggable onDragStart={(e) => { e.dataTransfer.setData("text/plain", id); setSeret(id); }} onDragEnd={() => setSeret(null)} title="Seret untuk memindah urutan" className="cursor-grab select-none px-0.5">&#10303;</span>
            {namaBlok(tata, id)}
            <button type="button" onClick={() => pindah(id, -1)} title="Naikkan urutan" className="px-0.5">&#8593;</button>
            <button type="button" onClick={() => pindah(id, 1)} title="Turunkan urutan" className="px-0.5">&#8595;</button>
          </div>
        )}
        {node}
        {aktif && (
          <div onPointerDown={mulaiUbah(id)} onPointerMove={geserUbah} onPointerUp={selesaiUbah} onPointerCancel={selesaiUbah} title="Tarik untuk mengubah lebar dan tinggi"
            className="absolute bottom-1 right-1 z-20 grid h-6 w-6 cursor-nwse-resize touch-none place-items-center rounded bg-amber-400 text-xs text-black shadow">&#8689;</div>
        )}
      </div>
    );
  };

  const g = tata.gaya[terpilih];
  return (
    <form action={aksi} className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <input type="hidden" name="tata" value={JSON.stringify(tata)} />
      <div className="info-kanvas rounded-2xl bg-ms-bg p-4 pt-6 text-ms-cream sm:p-6 sm:pt-8">
        <p className="mb-5 text-xs text-ms-cream/60">
          {aktif ? "Mode tata letak: klik sebuah blok, seret pegangan di atasnya untuk memindah, tarik sudut kanan bawah untuk mengubah ukuran. Atur detailnya di panel kanan." : "Ketik langsung pada kartu di bawah. Tampilannya sama dengan Beranda dan halaman Informasi. Kolom yang dikosongkan kembali ke teks bawaan."}
        </p>
        <InformasiTampilan isi={isi} tombol={tombol} tata={tata} bungkus={bungkus} editor gridRef={gridRef} isiK={isiK} tombolK={tombolK} />
        {tata.dihapus.flatMap((g) => INFORMASI_FIELDS.filter((x) => x.grup === g).flatMap((x) => x.fields.map((f) => <input key={`${g}__${f.key}`} type="hidden" name={`${g}__${f.key}`} defaultValue={nilai(g, f.key)} />)))}
      </div>
      <aside className="a-card space-y-3 p-4 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
        <h2 className="text-sm font-semibold">Informasi Pilihan</h2>
        <button className="a-btn w-full justify-center">Simpan perubahan</button>
        <Link href="/informasi" target="_blank" className="a-btn-soft w-full justify-center text-sm">Lihat di situs &#8599;</Link>
        <div className="a-tab-baris w-full" role="group" aria-label="Mode edit">
          <button type="button" className="a-tab flex-1" aria-current={!aktif ? "page" : undefined} onClick={() => setMode("teks")}>Edit teks</button>
          <button type="button" className="a-tab flex-1" aria-current={aktif ? "page" : undefined} onClick={() => setMode("tata")}>Tata letak</button>
        </div>
        <div className="space-y-2 border-t pt-3 text-sm">
          <p className="font-medium">Tambah blok baru <span className="a-muted text-xs font-normal">({tata.kustom.length}/{MAKS_KUSTOM})</span></p>
          <div className="grid grid-cols-2 gap-1.5">
            {MODEL_KUSTOM.map((m) => (
              <button key={m.id} type="button" disabled={tata.kustom.length >= MAKS_KUSTOM} onClick={() => tambah(m.id)} data-tip={m.ket} className="a-btn-soft justify-center px-1 text-xs disabled:opacity-50">+ {m.nama}</button>
            ))}
          </div>
          <p className="a-muted text-xs">Blok baru muncul di akhir dan terpilih otomatis. Ketik isinya langsung pada kartu; atur urutan, lebar, dan warna di mode Tata letak.</p>
        </div>
        {kb && (
          <div className="space-y-2 border-t pt-3 text-sm">
            <p className="font-medium">Blok terpilih: {namaBlok(tata, kb.id)}</p>
            <label className="block">Model
              <select value={kb.model} onChange={(e) => setKustom(kb.id, { model: e.target.value as ModelKustom })} className={kecilIn}>{MODEL_KUSTOM.map((m) => <option key={m.id} value={m.id}>{m.nama}</option>)}</select>
            </label>
            {(kb.model === "gambar") && (
              <label className="block">Alamat gambar (https)
                <input value={kb.gambar} onChange={(e) => setKustom(kb.id, { gambar: e.target.value })} maxLength={800} placeholder="https://ik.imagekit.io/..." className={kecilIn} />
              </label>
            )}
            {kb.model !== "kutipan" && (
              <label className="block">Tautan tombol
                <input value={kb.href} onChange={(e) => setKustom(kb.id, { href: e.target.value })} maxLength={500} placeholder="/artikel/slug atau https://..." className={kecilIn} />
              </label>
            )}
            <p className="a-muted text-xs">Tombol hanya tampil di situs bila teks tombol dan tautannya terisi. Alamat gambar dan tautan yang tidak aman dikosongkan otomatis saat disimpan.</p>
          </div>
        )}
        {aktif ? (
          <div className="space-y-3 border-t pt-3 text-sm">
            <label className="block">Blok yang diatur
              <select value={terpilih} onChange={(e) => setTerpilih(e.target.value)} className={kecilIn}>{idTampil(tata, true).map((b) => <option key={b} value={b}>{namaBlok(tata, b)}</option>)}</select>
            </label>
            <label className="block">Lebar
              <select value={g.lebar} onChange={(e) => setGaya(terpilih, { lebar: Number(e.target.value) })} className={kecilIn}>{LEBAR_PILIHAN.map(([n, t]) => <option key={n} value={n}>{t}</option>)}</select>
            </label>
            <label className="block">Tinggi minimal: {g.tinggi ? `${g.tinggi}px` : "otomatis"}
              <input type="range" min={0} max={600} step={10} value={g.tinggi} onChange={(e) => setGaya(terpilih, { tinggi: Number(e.target.value) })} className="w-full" />
            </label>
            <div>
              <p className="mb-1">Bentuk sudut</p>
              <div className="grid grid-cols-4 gap-1">
                {(["kotak", "sedang", "besar", "pil"] as const).map((b) => (
                  <button key={b} type="button" onClick={() => setGaya(terpilih, { bentuk: b })} className={`a-btn-soft px-1 text-xs ${g.bentuk === b ? "ring-2 ring-amber-400" : ""}`}>{b}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1">Latar</p>
              <div className="flex flex-wrap items-center gap-1.5">
                <button type="button" onClick={() => setGaya(terpilih, { latar: "" })} className={`a-btn-soft px-2 text-xs ${!g.latar ? "ring-2 ring-amber-400" : ""}`}>bawaan</button>
                {Object.entries(LATAR).map(([k, v]) => (
                  <button key={k} type="button" title={v.nama} aria-label={v.nama} onClick={() => setGaya(terpilih, { latar: k })} style={{ background: v.css }} className={`h-7 w-7 rounded-full border ${g.latar === k ? "ring-2 ring-amber-400" : ""}`} />
                ))}
                <input type="color" aria-label="Warna latar sendiri" value={/^#[0-9a-f]{6}$/i.test(g.latar) ? g.latar : "#1f1610"} onChange={(e) => setGaya(terpilih, { latar: e.target.value })} className="h-7 w-9 cursor-pointer rounded border p-0" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span>Warna teks</span>
              <input type="color" aria-label="Warna teks" value={g.teks || "#ffffff"} onChange={(e) => setGaya(terpilih, { teks: e.target.value })} className="h-7 w-9 cursor-pointer rounded border p-0" />
              <button type="button" onClick={() => setGaya(terpilih, { teks: "" })} className="a-btn-soft px-2 text-xs">bawaan</button>
            </div>
            <label className="block">Jenis huruf
              <select value={g.font} onChange={(e) => setGaya(terpilih, { font: e.target.value as GayaBlok["font"] })} className={kecilIn}>
                <option value="bawaan">Bawaan blok</option><option value="serif">Serif (judul, Playfair)</option><option value="sans">Sans (isi, Plus Jakarta)</option><option value="mono">Monospasi</option>
              </select>
            </label>
            <label className="block">Ukuran isi blok: {g.skala}%
              <input type="range" min={70} max={140} step={5} value={g.skala} onChange={(e) => setGaya(terpilih, { skala: Number(e.target.value) })} className="w-full" />
            </label>
            <label className="block">Animasi (tampil di situs)
              <select value={g.animasi} onChange={(e) => setGaya(terpilih, { animasi: e.target.value })} className={kecilIn}>{ANIMASI.map((a) => <option key={a.id} value={a.id}>{a.nama}</option>)}</select>
            </label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={g.sembunyi} onChange={(e) => setGaya(terpilih, { sembunyi: e.target.checked })} /> Sembunyikan blok di situs</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setGaya(terpilih, kb ? gayaKustom(kb.model) : gayaBawaan(terpilih as BlokId))} className="a-btn-soft flex-1 text-xs">Reset blok</button>
              <button type="button" onClick={() => { if (window.confirm("Kembalikan semua blok ke tata letak bawaan? Blok baru yang Anda buat ikut dihapus (setelah Simpan).")) { setTata(tataBawaan()); setTerpilih("merah"); } }} className="a-btn-soft flex-1 text-xs">Reset semua</button>
            </div>
            <button type="button" onClick={() => hapusBlok(terpilih)} className="a-btn-soft w-full text-xs text-red-700">{kb ? "Hapus blok ini" : "Hapus blok bawaan ini"}</button>
          </div>
        ) : (
          <p className="a-muted border-t pt-3 text-xs">Untuk huruf tebal pada isi kartu krem, apit kata dengan dua tanda bintang: **seperti ini**. Perubahan tata letak baru berlaku setelah Simpan perubahan.</p>
        )}
        {tata.dihapus.length > 0 && (
          <div className="space-y-2 border-t pt-3 text-sm">
            <p className="font-medium">Blok bawaan yang dihapus</p>
            <div className="flex flex-wrap gap-1.5">
              {tata.dihapus.map((b) => <button key={b} type="button" onClick={() => pulihkan(b)} className="a-btn-soft px-2 text-xs">Pulihkan {namaBlok(tata, b)}</button>)}
            </div>
          </div>
        )}
      </aside>
    </form>
  );
}

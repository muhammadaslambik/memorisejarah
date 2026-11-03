// PAKET-12B: catatan kaki bernomor otomatis. Nomor selalu mengikuti urutan kemunculan dari atas ke bawah:
// menyisipkan catatan baru di antara [6] dan [7] membuatnya menjadi [7], dan catatan lama [7] menjadi [8], dst.
// Bentuk di dalam artikel sama dengan WordPress: rujukan <a id="_ftnref7" href="#_ftn7">[7]</a>
// dan catatan di akhir <p><a id="_ftn7" href="#_ftnref7">[7]</a> teks catatan</p>.
import { TextSelection } from "@tiptap/pm/state";
import type { EditorState, Transaction } from "@tiptap/pm/state";
import type { Node as PMNode } from "@tiptap/pm/model";

const REF = /^(_ftnref|fnref)(\d+)$/;
const NOTE = /^(_ftn|fn)(\d+)$/;
const PASANGAN: Record<string, string> = { _ftnref: "_ftn", fnref: "fn", _ftn: "_ftnref", fn: "fnref" };

type Temu = { pos: number; node: PMNode; jenis: "ref" | "catatan"; prefix: string; nomor: number };

function kumpulkan(doc: PMNode): Temu[] {
  const out: Temu[] = [];
  doc.descendants((node, pos) => {
    if (!node.isText) return;
    const id = node.marks.find((m) => m.type.name === "link")?.attrs.id as string | null | undefined;
    if (!id) return;
    const r = REF.exec(id);
    if (r) { out.push({ pos, node, jenis: "ref", prefix: r[1], nomor: Number(r[2]) }); return; }
    const n = NOTE.exec(id);
    if (n) out.push({ pos, node, jenis: "catatan", prefix: n[1], nomor: Number(n[2]) });
  });
  return out;
}

// Menyusun ulang nomor (dan urutan paragraf catatan di akhir) pada transaksi yang diberikan.
export function susunCatatanKaki(tr: Transaction): { berubah: boolean; peta: Map<number, number> } {
  const peta = new Map<number, number>();
  const awal = kumpulkan(tr.doc);
  let n = 0;
  for (const i of awal) if (i.jenis === "ref" && !peta.has(i.nomor)) peta.set(i.nomor, ++n);
  for (const i of awal) if (i.jenis === "catatan" && !peta.has(i.nomor)) peta.set(i.nomor, ++n); // catatan yatim: di belakang
  let berubah = false;

  // 1) ganti nomor (dari posisi paling belakang agar posisi di depan tetap benar)
  for (const i of [...awal].reverse()) {
    const baru = peta.get(i.nomor)!;
    const teks = i.node.text!.replace(/\d+/, String(baru));
    const id = `${i.prefix}${baru}`;
    const href = `#${PASANGAN[i.prefix]}${baru}`;
    const link = i.node.marks.find((m) => m.type.name === "link")!;
    if (teks === i.node.text && link.attrs.id === id && link.attrs.href === href) continue;
    const marks = i.node.marks.map((m) => (m === link ? m.type.create({ ...m.attrs, id, href }) : m));
    tr.replaceWith(i.pos, i.pos + i.node.nodeSize, tr.doc.type.schema.text(teks, marks));
    berubah = true;
  }

  // 2) urutkan paragraf catatan di akhir (hanya bila semuanya paragraf tingkat atas dan satu catatan per paragraf)
  const doc = tr.doc;
  const catatan = kumpulkan(doc).filter((i) => i.jenis === "catatan");
  const slot = catatan.map((i) => ({ index: doc.resolve(i.pos).index(0), dalam: doc.resolve(i.pos).depth, nomor: i.nomor }));
  const indeks = slot.map((s) => s.index);
  if (slot.length > 1 && slot.every((s) => s.dalam === 1) && new Set(indeks).size === indeks.length) {
    const urut = [...slot].sort((a, b) => a.nomor - b.nomor);
    if (urut.some((s, k) => s.index !== slot[k].index)) {
      const offset: number[] = [];
      doc.forEach((_c, o) => offset.push(o));
      for (let k = slot.length - 1; k >= 0; k--) {
        const lama = doc.child(slot[k].index);
        const baru = doc.child(urut[k].index);
        const dari = offset[slot[k].index];
        tr.replaceWith(dari, dari + lama.nodeSize, baru);
      }
      berubah = true;
    }
  }
  return { berubah, peta };
}

// Menyisipkan rujukan di kursor + paragraf catatan di akhir artikel, lalu menomori ulang semuanya.
export function sisipCatatanKaki(state: EditorState): { tr: Transaction; nomor: number } | null {
  const link = state.schema.marks.link;
  const para = state.schema.nodes.paragraph;
  if (!link || !para || !state.selection.$to.parent.inlineContent) return null;
  const sementara = kumpulkan(state.doc).reduce((a, i) => Math.max(a, i.nomor), 0) + 1;
  const ref = state.schema.text(`[${sementara}]`, [link.create({ href: `#_ftn${sementara}`, id: `_ftnref${sementara}` })]);
  const catatan = para.create(null, [
    state.schema.text(`[${sementara}]`, [link.create({ href: `#_ftnref${sementara}`, id: `_ftn${sementara}` })]),
    state.schema.text(" "),
  ]);
  const tr = state.tr;
  const posRef = state.selection.to;
  tr.insert(tr.doc.content.size, catatan); // di akhir dulu, supaya posisi kursor tidak bergeser
  tr.insert(posRef, ref);
  const sesudahRef = posRef + ref.nodeSize;
  const langkah = tr.steps.length;
  const { peta } = susunCatatanKaki(tr);
  const pos = tr.mapping.slice(langkah).map(sesudahRef, 1);
  tr.setSelection(TextSelection.near(tr.doc.resolve(Math.min(pos, tr.doc.content.size)), 1)).scrollIntoView();
  return { tr, nomor: peta.get(sementara) ?? sementara };
}

// Posisi akhir baris catatan bernomor tertentu (untuk melompat ke sana dan mulai mengetik)
export function posisiCatatan(state: EditorState, nomor: number): number | null {
  const t = kumpulkan(state.doc).find((i) => i.jenis === "catatan" && i.nomor === nomor);
  return t ? state.doc.resolve(t.pos).end() : null;
}

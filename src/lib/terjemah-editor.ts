// PAKET-13C: mengumpulkan dan mengganti teks pada dokumen editor (ProseMirror) tanpa merusak format
import type { Node as PMNode, Mark } from "@tiptap/pm/model";
import type { Transaction } from "@tiptap/pm/state";

export type Potongan = { from: number; to: number; inti: string; awal: string; akhir: string; marks: readonly Mark[] };

const CATATAN_KAKI = /^(_ftnref|_ftn|fnref|fn)\d+$/;

// Teks yang layak diterjemahkan pada rentang tertentu; rujukan catatan kaki, kode, dan teks tanpa huruf dilewati
export function kumpulkanTeks(doc: PMNode, dari: number, sampai: number): Potongan[] {
  const out: Potongan[] = [];
  doc.nodesBetween(dari, sampai, (node, pos) => {
    if (!node.isText || !node.text) return;
    if (node.marks.some((m) => (m.type.name === "link" && CATATAN_KAKI.test(String(m.attrs.id ?? ""))) || m.type.name === "code")) return;
    const a = Math.max(dari, pos);
    const b = Math.min(sampai, pos + node.nodeSize);
    const teks = node.text.slice(a - pos, b - pos);
    const inti = teks.trim();
    if (!/\p{L}/u.test(inti)) return;
    out.push({
      from: a,
      to: b,
      inti: inti.replace(/\s*\n\s*/g, " "),
      awal: teks.slice(0, teks.length - teks.trimStart().length),
      akhir: teks.slice(teks.trimEnd().length),
      marks: node.marks,
    });
  });
  return out;
}

// Mengganti teks dari belakang ke depan agar posisi di depan tetap benar
export function terapkanTerjemahan(tr: Transaction, potongan: Potongan[], hasil: string[]): void {
  for (let i = potongan.length - 1; i >= 0; i--) {
    const p = potongan[i];
    const t = hasil[i];
    if (!t || t === p.inti) continue;
    tr.replaceWith(p.from, p.to, tr.doc.type.schema.text(p.awal + t + p.akhir, p.marks));
  }
}

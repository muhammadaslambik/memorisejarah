// PAKET-10A: mengubah teks berformat sederhana (versi lama: ## - 1. > **tebal** [teks](/alamat)) menjadi HTML.
// Dipakai agar teks bawaan dan teks yang dulu disimpan dengan kode tetap tampil benar di editor baru.
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const URL_AMAN = /^(\/(?!\/)|https:\/\/|mailto:)/i;

const sebaris = (s: string) =>
  esc(s)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t: string, u: string) => (URL_AMAN.test(u) ? `<a href="${u}">${t}</a>` : m));

export function markupKeHtml(teks: string): string {
  const blok = teks.replace(/\r\n/g, "\n").split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return blok.map((b) => {
    const baris = b.split("\n");
    if (b.startsWith("## ")) return `<h3>${sebaris(b.slice(3))}</h3>`;
    if (b.startsWith("> ")) return `<blockquote><p>${sebaris(baris.map((l) => l.replace(/^>\s?/, "")).join(" "))}</p></blockquote>`;
    if (baris.every((l) => /^-\s/.test(l))) return `<ul>${baris.map((l) => `<li><p>${sebaris(l.replace(/^-\s/, ""))}</p></li>`).join("")}</ul>`;
    if (baris.every((l) => /^\d+\.\s/.test(l))) return `<ol>${baris.map((l) => `<li><p>${sebaris(l.replace(/^\d+\.\s/, ""))}</p></li>`).join("")}</ol>`;
    return `<p>${sebaris(baris.join(" "))}</p>`;
  }).join("");
}

// Isi yang sudah berupa HTML dipakai apa adanya; selain itu dianggap teks berformat lama
export const jadiHtml = (isi: string) => (/^\s*</.test(isi) ? isi : markupKeHtml(isi));
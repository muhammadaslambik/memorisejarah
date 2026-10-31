// PAKET-6A
import { FilterXSS, escapeAttrValue, friendlyAttrValue, safeAttrValue } from "xss";

// Daftar putih: tag yang bisa dihasilkan editor (TipTap) dan yang dibawa artikel WordPress
// (gambar dalam figure, catatan kaki berupa tautan ber-id). Tag lain (script, iframe, style, form, dll.)
// dibuang; script dan style dibuang beserta isinya. Komentar HTML dibuang oleh pustaka xss.
const whiteList: Record<string, string[]> = {
  p: [], br: [], hr: [], h1: [], h2: [], h3: [], h4: [], h5: [], h6: [],
  strong: [], b: [], em: [], i: [], s: [], u: [], sup: [], sub: [], code: ["class"], pre: [], blockquote: [],
  ul: [], ol: [], li: [],
  a: ["href", "title", "id"],
  img: ["src", "alt", "title"],
  figure: [], figcaption: [],
};

const SAFE_URL = /^(https?:\/\/|mailto:|\/(?!\/)|#)/i;
// id hanya untuk jangkar catatan kaki (_ftn1, _ftnref1, fn1, fnref1); id lain dibuang agar tidak menimpa elemen halaman
const SAFE_ID = /^_?(ftn|fn)(ref)?\d{1,4}$/;

const filter = new FilterXSS({
  whiteList,
  stripIgnoreTag: true,
  stripIgnoreTagBody: ["script", "style"],
  safeAttrValue(tag, name, value, css) {
    if (name === "href" || name === "src") {
      const v = friendlyAttrValue(value).trim();
      return SAFE_URL.test(v) ? escapeAttrValue(v) : ""; // tolak javascript:, data:, dll.
    }
    if (name === "id") return SAFE_ID.test(value) ? escapeAttrValue(value) : "";
    if (name === "class") return /^language-[\w-]+$/.test(value) ? escapeAttrValue(value) : "";
    return safeAttrValue(tag, name, value, css);
  },
});

export const sanitizeHtml = (html: string) => filter.process(html);

// URL gambar sampul: hanya http(s)
export const safeCoverUrl = (v: string) => (/^https?:\/\//i.test(v.trim()) ? v.trim() : null);
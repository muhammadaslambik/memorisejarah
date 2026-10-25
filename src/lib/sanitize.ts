import { FilterXSS, escapeAttrValue, friendlyAttrValue, safeAttrValue } from "xss";

// Daftar putih: hanya tag yang bisa dihasilkan editor (TipTap StarterKit) ditambah gambar dan tautan.
// Semua tag lain (script, iframe, style, form, dll.) dibuang; script dan style dibuang beserta isinya.
const whiteList: Record<string, string[]> = {
  p: [], br: [], hr: [], h1: [], h2: [], h3: [], h4: [], h5: [], h6: [],
  strong: [], b: [], em: [], i: [], s: [], u: [], code: ["class"], pre: [], blockquote: [],
  ul: [], ol: [], li: [],
  a: ["href", "title"],
  img: ["src", "alt", "title"],
};

const SAFE_URL = /^(https?:\/\/|mailto:|\/(?!\/)|#)/i;

const filter = new FilterXSS({
  whiteList,
  stripIgnoreTag: true,
  stripIgnoreTagBody: ["script", "style"],
  safeAttrValue(tag, name, value, css) {
    if (name === "href" || name === "src") {
      const v = friendlyAttrValue(value).trim();
      return SAFE_URL.test(v) ? escapeAttrValue(v) : ""; // tolak javascript:, data:, dll.
    }
    if (name === "class") return /^language-[\w-]+$/.test(value) ? escapeAttrValue(value) : "";
    return safeAttrValue(tag, name, value, css);
  },
});

export const sanitizeHtml = (html: string) => filter.process(html);

// URL gambar sampul: hanya http(s)
export const safeCoverUrl = (v: string) => (/^https?:\/\//i.test(v.trim()) ? v.trim() : null);

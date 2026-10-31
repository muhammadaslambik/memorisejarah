// PAKET-6A: ekstensi TipTap bersama (dipakai Editor dan pengujian)
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { Node, mergeAttributes } from "@tiptap/core";

// <figure><img><figcaption>: gambar dengan keterangan (bentuk yang dipakai WordPress)
export const Figure = Node.create({
  name: "figure",
  group: "block",
  content: "image figcaption?",
  draggable: true,
  isolating: true,
  parseHTML() { return [{ tag: "figure" }]; },
  renderHTML({ HTMLAttributes }) { return ["figure", mergeAttributes(HTMLAttributes), 0]; },
});

export const Figcaption = Node.create({
  name: "figcaption",
  content: "inline*",
  defining: true,
  parseHTML() { return [{ tag: "figcaption" }]; },
  renderHTML({ HTMLAttributes }) { return ["figcaption", mergeAttributes(HTMLAttributes), 0]; },
});

// Tautan yang mempertahankan atribut id (jangkar catatan kaki #_ftn1 / #_ftnref1)
export const Tautan = Link.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      id: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute("id"),
        renderHTML: (a: Record<string, unknown>) => (a.id ? { id: a.id } : {}),
      },
    };
  },
}).configure({ openOnClick: false, autolink: false, HTMLAttributes: { target: null, rel: null } });

export const ekstensiEditor = [StarterKit, Image, Figure, Figcaption, Tautan];
"use client";
import { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

// Editor TipTap; isi HTML disalin ke input hidden agar ikut terkirim ke Server Action
export function Editor({ initial }: { initial: string }) {
  const [html, setHtml] = useState(initial);
  const editor = useEditor({
    extensions: [StarterKit],
    content: initial,
    immediatelyRender: false,
    onUpdate: ({ editor }) => setHtml(editor.getHTML()),
    editorProps: { attributes: { class: "prose prose-stone min-h-[300px] max-w-none rounded-b border bg-white p-4 focus:outline-none" } },
  });
  const btn = (label: string, run: () => void) => (
    <button type="button" onClick={run} className="rounded border bg-white px-3 py-1 text-sm">{label}</button>
  );
  return (
    <div>
      <div className="flex flex-wrap gap-2 rounded-t border border-b-0 bg-cream-dark p-2">
        {btn("B", () => editor?.chain().focus().toggleBold().run())}
        {btn("I", () => editor?.chain().focus().toggleItalic().run())}
        {btn("H2", () => editor?.chain().focus().toggleHeading({ level: 2 }).run())}
        {btn("H3", () => editor?.chain().focus().toggleHeading({ level: 3 }).run())}
        {btn("Daftar", () => editor?.chain().focus().toggleBulletList().run())}
        {btn("Kutipan", () => editor?.chain().focus().toggleBlockquote().run())}
      </div>
      <EditorContent editor={editor} />
      <input type="hidden" name="content" value={html} />
    </div>
  );
}

"use client";

// Tombol hapus dengan konfirmasi; dipakai di dalam <form action={deletePost}>
export function DeleteButton({ title }: { title: string }) {
  return (
    <button
      className="text-sm text-red-700"
      onClick={(e) => {
        if (!confirm(`Hapus artikel "${title}"? Tindakan ini tidak bisa dibatalkan.`)) e.preventDefault();
      }}
    >
      Hapus
    </button>
  );
}

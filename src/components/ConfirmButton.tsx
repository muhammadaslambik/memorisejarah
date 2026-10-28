// PAKET-1B
"use client";

// Tombol dengan konfirmasi, dipakai di dalam <form action={...}>
export function ConfirmButton({ pesan, label = "Hapus" }: { pesan: string; label?: string }) {
  return (
    <button
      className="text-sm text-red-700"
      onClick={(e) => {
        if (!confirm(pesan)) e.preventDefault();
      }}
    >
      {label}
    </button>
  );
}
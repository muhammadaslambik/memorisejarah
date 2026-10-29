// PAKET-3A: folder pustaka (Google Drive) dari blog lama
export const PUSTAKA = [
  { kunci: "arsip", nama: "Arsip & Dokumen", id: "1ZpcIwvG--vQpFtlbAVPS00YUHwZxXMlQ", ket: "Dokumen dan arsip sumber primer." },
  { kunci: "majalah", nama: "Majalah & Surat Kabar", id: "15_mQius0eOelZCYoM_7DbjoY5RTmeT2m", ket: "Terbitan berkala dari masa lalu." },
  { kunci: "buku", nama: "Artikel & Buku", id: "1lTSTRNX8FdfYj9DtBkCfdf40A8BzprVa", ket: "Kajian, jurnal, dan buku sejarah." },
  { kunci: "foto", nama: "Foto, Gambar & Lukisan", id: "1qqpe-kG6g-7E08O_n6Ki3cS5P9iE-9tY", ket: "Koleksi visual peristiwa dan tokoh." },
].map((p) => ({ ...p, url: `https://drive.google.com/drive/folders/${p.id}?usp=sharing` }));
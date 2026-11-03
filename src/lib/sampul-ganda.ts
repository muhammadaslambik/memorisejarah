// PAKET-12A: mencegah foto ganda. Bila gambar sampul ternyata sama dengan salah satu gambar di isi artikel
// (umum pada artikel impor WordPress), sampul tidak ditampilkan lagi supaya foto tidak muncul dua kali.
const tanpaQuery = (u: string) => u.split("?")[0].trim().toLowerCase();

// Nama berkas tanpa ekstensi, tanpa akhiran ukuran WordPress (-1024x768) dan tanpa akhiran acak ImageKit (_aB3dE9x)
const namaInti = (u: string) => {
  const akhir = tanpaQuery(u).split("/").pop() ?? "";
  return akhir
    .replace(/\.[a-z0-9]{2,5}$/, "")
    .replace(/-\d+x\d+$/, "")
    .replace(/_(?=[a-z0-9]{6,8}$)(?=[a-z]*\d)[a-z0-9]+$/, "");
};

export function sampulSudahAdaDiIsi(cover: string | null | undefined, html: string): boolean {
  if (!cover) return false;
  const penuh = tanpaQuery(cover);
  const nama = namaInti(cover);
  const re = /<img\b[^>]*?\ssrc="([^"]+)"/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    if (tanpaQuery(m[1]) === penuh) return true;
    if (nama.length >= 6 && namaInti(m[1]) === nama) return true;
  }
  return false;
}

// PAKET-14B: gambar ImageKit di artikel dimuat dalam ukuran wajar (lebar maksimal 1200 px) dan malas (lazy) di halaman publik.
// Gambar yang dipotong (?tr=cm-extract,...) tetap didukung: potongan dirangkai dengan pengecilan (dipisah ":").
export function optimalkanGambar(html: string): string {
  return html.replace(/<img\b([^>]*?)\ssrc="(https:\/\/ik\.imagekit\.io\/[^"?]+)(?:\?tr=([^"]*))?"([^>]*)>/gi, (_m, a: string, src: string, tr: string | undefined, b: string) => {
    const malas = /\sloading=/.test(a + b) ? "" : ' loading="lazy" decoding="async"';
    const lebarPotong = tr ? Number(/(?:^|,)w-(\d+)/.exec(tr)?.[1]) : NaN;
    const ukuran = Number.isFinite(lebarPotong) && lebarPotong <= 1200 ? "q-85" : "w-1200,q-85"; // jangan memperbesar potongan kecil
    return `<img${a} src="${src}?tr=${tr ? `${tr}:${ukuran}` : ukuran}"${b}${malas}>`;
  });
}

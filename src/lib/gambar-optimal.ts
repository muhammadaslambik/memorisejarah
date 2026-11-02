// PAKET-11A: gambar ImageKit di artikel dimuat dalam ukuran wajar (lebar maksimal 1200 px) dan malas (lazy) di halaman publik
export function optimalkanGambar(html: string): string {
  return html.replace(/<img\b([^>]*?)\ssrc="(https:\/\/ik\.imagekit\.io\/[^"?]+)"([^>]*)>/gi, (_m, a: string, src: string, b: string) => {
    const malas = /\sloading=/.test(a + b) ? "" : ' loading="lazy" decoding="async"';
    return `<img${a} src="${src}?tr=w-1200,q-85"${b}${malas}>`;
  });
}
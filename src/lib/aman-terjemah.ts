// PAKET-42: Google Translate membungkus setiap teks halaman dengan elemen <font> dan membuang simpul teks aslinya dari DOM. Bila React kemudian mengganti/menghapus simpul teks itu
// (mis. label tombol yang berubah), peramban melempar "Failed to execute 'removeChild' on 'Node'" dan seluruh halaman runtuh ("Application error: a client-side exception").
// Pengaman ini (dikenal luas untuk React + Google Translate) membuat removeChild/insertBefore mengabaikan simpul yang sudah bukan anak dari induknya, alih-alih melempar galat.
// Dipasang sekali, sebelum skrip Google dimuat. Akibat terburuknya hanya satu teks yang tidak ikut berubah di halaman terjemahan, bukan halaman yang runtuh.
type NodeAman = typeof Node.prototype & { __msAman?: boolean };

export function pasangPengamanTerjemah() {
  if (typeof Node !== "function" || !Node.prototype) return;
  const proto = Node.prototype as NodeAman;
  if (proto.__msAman) return;
  proto.__msAman = true;
  const hapusAsli = proto.removeChild;
  proto.removeChild = function <T extends Node>(this: Node, anak: T): T {
    if (anak.parentNode !== this) return anak;
    return hapusAsli.call(this, anak) as T;
  };
  const sisipAsli = proto.insertBefore;
  proto.insertBefore = function <T extends Node>(this: Node, baru: T, acuan: Node | null): T {
    if (acuan && acuan.parentNode !== this) return baru;
    return sisipAsli.call(this, baru, acuan) as T;
  };
}

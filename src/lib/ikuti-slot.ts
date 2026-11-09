// PAKET-18: pemutar mengikuti kotak "slot" di halaman TANPA tertinggal saat digulir.
// Pemutar diberi position:absolute di dalam dokumen (ikut tergulir oleh peramban sendiri, termasuk saat halaman memantul di ujung),
// dan posisinya hanya dikoreksi bila letak kotak berubah (ukuran jendela, tata letak, mode teater), bukan di tiap gulir.
export type PosisiIkuti = { l: number; t: number };

export function mulaiIkuti(el: HTMLElement, st: PosisiIkuti) {
  st.l = 0; st.t = 0;
  el.style.left = "0px";
  el.style.top = "0px";
}

export function ikutiSlot(el: HTMLElement, slot: Element, st: PosisiIkuti) {
  const r = slot.getBoundingClientRect();
  const c = el.getBoundingClientRect();
  const dl = r.left - c.left, dt = r.top - c.top;
  if (Math.abs(dl) > 0.5 || Math.abs(dt) > 0.5) {
    st.l += dl; st.t += dt;
    el.style.left = `${st.l}px`;
    el.style.top = `${st.t}px`;
  }
  if (Math.abs(c.width - r.width) > 0.5) el.style.width = `${r.width}px`;
  if (Math.abs(c.height - r.height) > 0.5) el.style.height = `${r.height}px`;
}

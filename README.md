# Memori Sejarah — Next.js + Neon + Cloudflare Pages (semua gratis, tanpa kartu)

## A. Setup lokal
1. Install Node 20+. Di folder proyek: `npm install`
2. Buat akun **Neon** (neon.tech, login GitHub/Google, tanpa kartu) → buat project → salin *connection string*.
3. `cp .env.example .env.local`, isi `DATABASE_URL`, `SESSION_SECRET` (acak ≥32 karakter), `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
4. `npm run db:push` (membuat tabel) lalu `npm run db:seed` (admin + kategori).
5. `npm run dev` → buka http://localhost:3000, login di `/admin/login`.

## B. Deploy ke Cloudflare Pages
1. Push proyek ke GitHub (`.env.local` jangan ikut).
2. Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git → pilih repo.
3. Framework preset: *None*. Build command: `npx @cloudflare/next-on-pages`. Output directory: `.vercel/output/static`.
4. Settings → Variables: isi `DATABASE_URL`, `SESSION_SECRET`, `NODE_VERSION=20`.
5. Settings → Functions → Compatibility flags: tambah `nodejs_compat` (Production & Preview), lalu redeploy.

## C. Domain memorisejarah.eu.org
1. Pages project → Custom domains → Set up → `memorisejarah.eu.org`.
2. Domain eu.org tidak bisa memakai CNAME di apex. Cara termudah: tambahkan domain ke Cloudflare (Add a site, plan Free), lalu di panel eu.org ganti Nameserver ke NS yang diberikan Cloudflare.
3. Tunggu propagasi (bisa beberapa jam–hari), lalu SSL aktif otomatis.

## D. Gambar
Cloudflare R2 mewajibkan kartu, jadi tidak dipakai. Pakai Supabase Storage / Cloudinary (free tier, tanpa kartu) lalu tempel URL gambar di kolom "URL gambar sampul" atau editor.

## E. Catatan
- `next-on-pages` sedang digantikan oleh OpenNext (`@opennextjs/cloudflare`); keduanya valid untuk saat ini.
- Konten disimpan sebagai HTML dari TipTap dan hanya bisa ditulis admin. Jika kelak ada penulis lain, tambahkan sanitasi HTML.

import { pgTable, serial, text, boolean, timestamp, integer, primaryKey } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(), // PBKDF2, lihat lib/auth.ts
  // Default "admin" hanya agar akun admin yang sudah ada tetap admin saat db:push.
  // Akun baru dibuat lewat halaman Pengguna dan SELALU menyebut peran secara eksplisit.
  role: text("role", { enum: ["admin", "editor", "penulis"] }).default("admin").notNull(),
  active: boolean("active").default(true).notNull(), // nonaktif = tidak bisa masuk (artikelnya tetap aman)
  // Penulis tepercaya: boleh langsung menerbitkan tanpa persetujuan (hanya berlaku untuk peran penulis)
  trusted: boolean("trusted").default(false).notNull(),
  // Peran yang diminta saat mendaftar sebagai admin/editor; terisi = menunggu persetujuan admin
  pendingRole: text("pending_role", { enum: ["admin", "editor"] }),
  photoUrl: text("photo_url"), // PAKET-15C: foto akun (alamat ImageKit)
});

// Catatan percobaan login yang gagal (untuk pembatasan)
export const loginAttempts = pgTable("login_attempts", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  ip: text("ip").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  parentId: integer("parent_id"), // induk (dua tingkat); kolom dibuat lewat scripts/kategori-wordpress.ts
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
});

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt").default("").notNull(),
  content: text("content").default("").notNull(), // HTML dari TipTap
  coverUrl: text("cover_url"),
  coverCaption: text("cover_caption"), // PAKET-15L: keterangan gambar utama
  featured: boolean("featured").default(false).notNull(),
  status: text("status", { enum: ["draft", "pending", "published"] }).default("draft").notNull(),
  categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
  authorId: integer("author_id").references(() => users.id),
  reviewNote: text("review_note"), // catatan editor saat mengembalikan artikel ke draft
  publishedAt: timestamp("published_at"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const postTags = pgTable("post_tags", {
  postId: integer("post_id").references(() => posts.id, { onDelete: "cascade" }).notNull(),
  tagId: integer("tag_id").references(() => tags.id, { onDelete: "cascade" }).notNull(),
}, (t) => [primaryKey({ columns: [t.postId, t.tagId] })]);

// Pengaturan situs (judul, deskripsi, menu) sebagai key-value
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

// Video (YouTube). Hanya ID video yang disimpan, bukan berkasnya.
export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  youtubeId: text("youtube_id").notNull(),
  programs: text("programs").array().notNull().default([]),
  description: text("description").default("").notNull(),
  featured: boolean("featured").default(false).notNull(),
  status: text("status", { enum: ["draft", "published"] }).default("draft").notNull(),
  categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
  publishedAt: timestamp("published_at"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Gambar (foto, lukisan, arsip). Yang disimpan alamat berkasnya.
export const images = pgTable("images", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  url: text("url").notNull(),
  caption: text("caption").default("").notNull(),
  credit: text("credit").default("").notNull(), // sumber atau pemilik gambar
  status: text("status", { enum: ["draft", "published"] }).default("draft").notNull(),
  categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
  publishedAt: timestamp("published_at"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Pengaturan tampilan situs yang diubah lewat CMS (nilai disimpan sebagai JSON teks)
export const siteSettings = pgTable("site_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Kategori artikel (banyak-ke-banyak). posts.category_id tetap sebagai kategori utama untuk lencana.
export const postCategories = pgTable("post_categories", {
  postId: integer("post_id").references(() => posts.id, { onDelete: "cascade" }).notNull(),
  categoryId: integer("category_id").references(() => categories.id, { onDelete: "cascade" }).notNull(),
}, (t) => [primaryKey({ columns: [t.postId, t.categoryId] })]);

// Redaksi: profil anggota dan keanggotaan tim (dikelola lewat /admin/redaksi)
export const redaksi = pgTable("redaksi", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  peran: text("peran").default("").notNull(),
  pemimpin: boolean("pemimpin").default(false).notNull(),
  urutan: integer("urutan").default(0).notNull(),
  bidang: text("bidang").default("").notNull(),
  bio: text("bio").default("").notNull(),
  bioLengkap: text("bio_lengkap").default("").notNull(), // HTML biografi lengkap (tombol "Lihat Biografi")
  fotoUrl: text("foto_url"),
  domisili: text("domisili").default("").notNull(),
  email: text("email").default("").notNull(),
  whatsapp: text("whatsapp").default("").notNull(),
  instagram: text("instagram").default("").notNull(),
  linkedin: text("linkedin").default("").notNull(),
  facebook: text("facebook").default("").notNull(),
  website: text("website").default("").notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  aktif: boolean("aktif").default(true).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const redaksiTim = pgTable("redaksi_tim", {
  memberId: integer("member_id").references(() => redaksi.id, { onDelete: "cascade" }).notNull(),
  tim: text("tim").notNull(),
  catatan: text("catatan").default("").notNull(),
}, (t) => [primaryKey({ columns: [t.memberId, t.tim] })]);

// Preferensi per akun (jumlah artikel per halaman di CMS; 0 = semua)
export const userPrefs = pgTable("user_prefs", {
  userId: integer("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  perHalaman: integer("per_halaman").default(20).notNull(),
});

// PAKET-13B: indeks galeri gambar (alamat ImageKit, fileId, hash isi untuk mencegah gambar kembar)
export const gambarBerkas = pgTable("gambar_berkas", {
  id: serial("id").primaryKey(),
  url: text("url").notNull().unique(),
  fileId: text("file_id"),
  nama: text("nama").notNull(),
  hash: text("hash"),
  hashAsli: text("hash_asli"),
  ukuran: integer("ukuran"),
  lebar: integer("lebar"),
  tinggi: integer("tinggi"),
  dibuat: timestamp("dibuat").defaultNow().notNull(),
});

// PAKET-19: Informasi Terbaru (kartu pendek di Beranda dan halaman Informasi), dibuat dari menu Informasi di CMS
export const infoItems = pgTable("info_items", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  summary: text("summary").default("").notNull(),
  imageUrl: text("image_url").default("").notNull(),
  linkUrl: text("link_url").default("").notNull(),
  label: text("label").default("").notNull(),
  status: text("status", { enum: ["draft", "published"] }).default("draft").notNull(),
  publishedAt: timestamp("published_at"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

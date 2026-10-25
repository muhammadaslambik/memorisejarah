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
});

// Catatan percobaan login yang gagal (untuk pembatasan)
export const loginAttempts = pgTable("login_attempts", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  ip: text("ip").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const categories = pgTable("categories", {
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

// PAKET-9A: kolom artikel untuk daftar/kartu (tanpa isi lengkap "content", yang berat)
import { posts } from "@/db";

export const kolomKartu = {
  id: posts.id,
  slug: posts.slug,
  title: posts.title,
  excerpt: posts.excerpt,
  coverUrl: posts.coverUrl,
  featured: posts.featured,
  status: posts.status,
  categoryId: posts.categoryId,
  authorId: posts.authorId,
  publishedAt: posts.publishedAt,
  updatedAt: posts.updatedAt,
  reviewNote: posts.reviewNote,
};
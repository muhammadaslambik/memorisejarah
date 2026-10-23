# Memori Sejarah

An Indonesian-language history article website with a custom-built CMS. It runs entirely on free tiers, with no credit card required.

**Live site:** https://memorisejarah.eu.org

## Features

**Public site**
- Homepage with a hero section for the featured article, plus a "Latest" list with pagination
- Article pages with category-based "Read more" suggestions
- Share buttons for WhatsApp, Facebook, and X
- Responsive layout

**Admin CMS**
- Login with custom authentication (PBKDF2 password hashing, JWT session cookie)
- Create, edit, and delete articles (with delete confirmation)
- Rich-text editor (TipTap): bold, italic, headings, lists, blockquotes
- Categories, draft/published status, featured flag, cover image by URL
- Editable article slug; the original publish date is preserved on later edits

## Tech Stack

| Area | Technology |
|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS, @tailwindcss/typography |
| Database | Neon Postgres via Drizzle ORM (neon-http driver) |
| Editor | TipTap |
| Auth | PBKDF2 + JWT (jose), protected `/admin` via middleware |
| Hosting | Cloudflare Workers via OpenNext (@opennextjs/cloudflare) |

## Local Setup

1. Install Node.js 20 or newer, then run `npm install` in the project folder.
2. Create a free [Neon](https://neon.tech) project and copy its connection string.
3. Copy `.env.example` to `.env.local` and fill in:
   - `DATABASE_URL`: the Neon connection string (ending in `sslmode=require`)
   - `SESSION_SECRET`: a random string of at least 32 characters
   - `ADMIN_EMAIL` and `ADMIN_PASSWORD`: the first admin account (used by the seed script)
4. Create the tables and seed the admin and categories:
   ```bash
   npm run db:push
   npm run db:seed
   ```
5. Start the dev server and open http://localhost:3000. Log in at `/admin/login`.
   ```bash
   npm run dev
   ```

## Deployment (Cloudflare Workers)

1. Push the repository to GitHub. Never commit `.env.local`.
2. In the Cloudflare dashboard, create a Worker from the GitHub repository (Workers Builds) and set:
   - Build command: `npx opennextjs-cloudflare build`
   - Deploy command: `npx opennextjs-cloudflare deploy`
3. Under Settings → Variables and Secrets, add `DATABASE_URL` and `SESSION_SECRET` as **Secrets**.
   `wrangler.jsonc` sets `keep_vars: true` so these values survive automatic deployments.
4. Custom domain: Settings → Domains & Routes → Add → Custom Domain. For `.eu.org` domains, first add the domain to Cloudflare (Free plan) and point its nameservers there from nic.eu.org.

## Roadmap

- Media library and image hosting on a free storage provider
- Tags, category pages, full-text search
- SEO: sitemap, robots.txt, Open Graph, JSON-LD
- Login rate limiting, multiple admin accounts, Google sign-in
- HTML sanitization for imported content
- WordPress content import

## Notes

- Article content is stored as HTML from the TipTap editor and can currently only be written by admins. HTML sanitization is planned before accepting content from other sources.
- Images are referenced by URL for now.
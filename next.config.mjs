/** @type {import('next').NextConfig} */
const nextConfig = { images: { unoptimized: true }, experimental: { serverActions: { bodySizeLimit: "11mb" } } }; // Cloudflare Pages: tanpa image optimizer bawaan Next
export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Self-contained server bundle (traced deps only) — small runtime footprint for the
  // 1 GB VPS. Runs as `node .next/standalone/server.js`; static/ and public/ are copied in.
  output: 'standalone',
  experimental: {
    serverActions: {
      // Дефолтный лимит тела server action — 1 МБ: любая картинка крупнее падала
      // с 413 при том, что формы админки (и API) обещают «до 5 МБ». Небольшой
      // запас сверх 5 МБ — на multipart-обвязку FormData.
      bodySizeLimit: '6mb',
    },
  },
};

export default nextConfig;

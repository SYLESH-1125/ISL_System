import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  // CWASA keeps global avatar GUI state; React Strict Mode dev double-mount can orphan the
  // first init and leave an empty stage. Disable strict mode for stable embedding.
  reactStrictMode: false,
  // Parent folder (e.g. W:\) has its own pnpm-lock.yaml; pin Turbopack to this app.
  turbopack: {
    root: __dirname,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig

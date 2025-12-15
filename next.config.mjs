/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // 减少输出日志以加快构建
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
}

export default nextConfig

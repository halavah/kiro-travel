/** @type {import('next').NextConfig} */
const nextConfig = {
  // Docker 部署支持：启用 standalone 模式
  output: 'standalone',

  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // 减少输出日���以加快构建
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
}

export default nextConfig

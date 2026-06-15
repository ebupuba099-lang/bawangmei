import type { NextConfig } from 'next';

const isProd = process.env.COZE_PROJECT_ENV !== 'DEV';

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  // 生产环境使用静态导出（GitHub Pages）；开发环境使用正常模式（支持 API Routes）
  ...(isProd ? { output: 'export' as const } : {}),
  // basePath 用于 GitHub Pages 子路径部署
  ...(isProd
    ? {
        basePath: '/bawangmei',
        assetPrefix: '/bawangmei/',
      }
    : {}),
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: ['*.dev.coze.site'],
};

export default nextConfig;

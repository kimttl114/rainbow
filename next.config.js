/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 이미지 최적화 설정
  images: {
    domains: [
      'firebasestorage.googleapis.com',
      'lh3.googleusercontent.com',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
      },
    ],
  },
};

module.exports = nextConfig;


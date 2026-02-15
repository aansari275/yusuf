/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/yusuf',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

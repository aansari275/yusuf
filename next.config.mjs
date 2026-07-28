/** @type {import('next').NextConfig} */

// GitHub Pages serves this project from https://<user>.github.io/yusuf/, so it
// needs a basePath. Netlify serves it from the root of https://mdyusuf.com, so
// there it must stay empty — otherwise every asset and link points at /yusuf/*
// and 404s.
const isGitHubPages = process.env.GITHUB_ACTIONS === 'true';

const nextConfig = {
  output: 'export',
  basePath: isGitHubPages ? '/yusuf' : '',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

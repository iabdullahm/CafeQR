import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // Fail the build on TypeScript errors.
    // Was previously `true` which hid real bugs (e.g. missing imports).
    ignoreBuildErrors: false,
  },
  eslint: {
    // Fail the build on lint errors. Existing `any`/unused-vars/unescaped-quote
    // issues were demoted to warnings in eslint.config.mjs; new real errors
    // (e.g. missing imports) will block the build.
    ignoreDuringBuilds: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;

import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // Fail the build on TypeScript errors.
    // Was previously `true` which hid real bugs (e.g. missing imports).
    ignoreBuildErrors: false,
  },
  eslint: {
    // TODO: migrate .eslintrc.json -> eslint.config.js (ESLint v9 flat config)
    // then flip this to false so lint errors also fail the build.
    ignoreDuringBuilds: true,
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

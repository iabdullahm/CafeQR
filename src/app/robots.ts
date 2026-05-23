/**
 * Next.js convention: this generates /robots.txt at build time.
 * Docs: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
 */
import type { MetadataRoute } from 'next';

const SITE_URL = 'https://www.cafe-qr.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/calculator', '/demo/menu'],
        // Keep private app surfaces out of search indexes.
        disallow: [
          '/api/',
          '/cafe-admin',
          '/super-admin',
          '/login',
          '/billing/',
          '/c/', // customer ordering pages — table-specific, no SEO value
        ],
      },
      // GPTBot / CCBot / Claude-Web etc. — opt-in to crawling marketing pages.
      {
        userAgent: ['GPTBot', 'ClaudeBot', 'CCBot', 'Google-Extended'],
        allow: ['/', '/calculator'],
        disallow: ['/api/', '/cafe-admin', '/super-admin', '/c/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

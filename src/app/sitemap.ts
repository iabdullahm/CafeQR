/**
 * Next.js convention: this generates /sitemap.xml at build time.
 * Docs: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 */
import type { MetadataRoute } from 'next';

const SITE_URL = 'https://www.cafe-qr.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Public marketing surfaces only. Private routes are blocked in robots.ts.
  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
      alternates: {
        languages: {
          en: `${SITE_URL}/?lang=en`,
          ar: `${SITE_URL}/?lang=ar`,
        },
      },
    },
    {
      url: `${SITE_URL}/calculator`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/demo/menu`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    // Anchor sections (Google sometimes surfaces them as separate results)
    {
      url: `${SITE_URL}/#pricing`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/#features`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];
}

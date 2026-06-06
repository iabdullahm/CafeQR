/**
 * prisma/scripts/null-dead-firebase-images.ts
 *
 * Last-resort cleanup for Phase 3: the Firebase project that owned the
 * old image URLs has its billing account in `delinquent` state, so the
 * bytes are unrecoverable without paying the outstanding bill. The image
 * URLs in Postgres still point at firebasestorage.googleapis.com and
 * return HTTP 402, so customers on cafe-qr.com see broken images.
 *
 * This script sets the URL columns to NULL where they point at a Firebase
 * Storage host:
 *   - menu_items.image
 *   - cafes.logo
 *   - cafes.cover_image
 *
 * After running, the customer UI falls back to placeholders, and cafe
 * owners can re-upload via cafe-admin -> Menu (which already uploads
 * to Vercel Blob through /api/upload/menu-image).
 *
 * Modes:
 *   npx tsx prisma/scripts/null-dead-firebase-images.ts             # do it
 *   npx tsx prisma/scripts/null-dead-firebase-images.ts --dry-run   # report only
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const FB_HOSTS = new Set([
  "firebasestorage.googleapis.com",
  "storage.googleapis.com",
]);

function isFirebaseUrl(u: string | null): boolean {
  if (!u) return false;
  try { return FB_HOSTS.has(new URL(u).host); } catch { return false; }
}

const dryRun = process.argv.includes("--dry-run");

async function main() {
  const prisma = new PrismaClient();
  let items = 0, logos = 0, covers = 0;

  try {
    // ---- menu_items.image ----
    const itemRows = await prisma.menuItem.findMany({
      where: { image: { not: null } },
      select: { id: true, image: true },
    });
    for (const r of itemRows) {
      if (!isFirebaseUrl(r.image)) continue;
      items++;
      if (!dryRun) {
        await prisma.menuItem.update({
          where: { id: r.id },
          data: { image: null },
        });
      }
    }

    // ---- cafes.logo + cafes.cover_image ----
    const cafeRows = await prisma.cafe.findMany({
      where: { OR: [{ logo: { not: null } }, { coverImage: { not: null } }] },
      select: { id: true, logo: true, coverImage: true },
    });
    for (const c of cafeRows) {
      const patch: { logo?: null; coverImage?: null } = {};
      if (isFirebaseUrl(c.logo)) { patch.logo = null; logos++; }
      if (isFirebaseUrl(c.coverImage)) { patch.coverImage = null; covers++; }
      if (!dryRun && Object.keys(patch).length > 0) {
        await prisma.cafe.update({ where: { id: c.id }, data: patch });
      }
    }

    console.log("");
    console.log(`OK${dryRun ? " (dry run)" : ""}`);
    console.log(`  menu_items cleared: ${items}`);
    console.log(`  cafes.logo cleared: ${logos}`);
    console.log(`  cafes.cover cleared: ${covers}`);
    console.log("");
    console.log("Next: tell cafe owners to re-upload their images via");
    console.log("  cafe-admin -> Menu -> Edit item -> Upload");
    console.log("New uploads go directly to Vercel Blob.");
  } finally {
    await prisma.$disconnect();
  }
}

void main();

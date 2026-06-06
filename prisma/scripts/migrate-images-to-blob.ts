/**
 * prisma/scripts/migrate-images-to-blob.ts
 *
 * Re-host any Firebase Storage image URL in Postgres on Vercel Blob.
 *
 * Touches three columns:
 *   - menu_items.image
 *   - cafes.logo
 *   - cafes.cover_image
 *
 * For each row whose URL points at a Firebase Storage host
 * (firebasestorage.googleapis.com, storage.googleapis.com), the script:
 *   1. fetches the bytes,
 *   2. puts() them into Vercel Blob under products/<cafeId>/...,
 *   3. updates the row to the new vercel-storage.com URL.
 *
 * Idempotent — already-Vercel URLs and unset (null) values are skipped.
 *
 * Requires:
 *   BLOB_READ_WRITE_TOKEN   (Vercel Blob token, set in your local .env)
 *   DATABASE_URL            (Neon Postgres, already in .env)
 *
 * Usage:
 *   npx tsx prisma/scripts/migrate-images-to-blob.ts [--dry-run]
 */

import "dotenv/config";
import { put } from "@vercel/blob";
import { PrismaClient } from "@prisma/client";

const FB_HOSTS = [
  "firebasestorage.googleapis.com",
  "storage.googleapis.com",
];

const dryRun = process.argv.includes("--dry-run");

function isFirebaseUrl(u: string | null | undefined): boolean {
  if (!u) return false;
  try {
    const url = new URL(u);
    return FB_HOSTS.includes(url.host);
  } catch {
    return false;
  }
}

function isVercelBlobUrl(u: string | null | undefined): boolean {
  if (!u) return false;
  try {
    const url = new URL(u);
    return url.host.endsWith(".vercel-storage.com") || url.host.endsWith(".public.blob.vercel-storage.com");
  } catch {
    return false;
  }
}

function inferExt(url: string, contentType: string | null): string {
  // Prefer extension from Content-Type, then URL path.
  if (contentType) {
    const t = contentType.toLowerCase().split(";")[0].trim();
    if (t === "image/jpeg" || t === "image/jpg") return "jpg";
    if (t === "image/png") return "png";
    if (t === "image/webp") return "webp";
    if (t === "image/gif") return "gif";
    if (t === "image/svg+xml") return "svg";
  }
  try {
    const u = new URL(url);
    const m = u.pathname.match(/\.([a-zA-Z0-9]{2,5})(?:$|\?)/);
    if (m) return m[1].toLowerCase();
  } catch { /* ignore */ }
  return "jpg";
}

async function rehost(
  url: string,
  pathnamePrefix: string
): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`  ! HTTP ${res.status} fetching ${url}`);
      return null;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get("content-type");
    const ext = inferExt(url, contentType);
    const pathname = `${pathnamePrefix}-${Date.now()}.${ext}`;

    if (dryRun) {
      console.log(`  (dry) would upload ${buf.length} bytes -> ${pathname}`);
      return `https://vercel-storage.com/${pathname}`;
    }

    const blob = await put(pathname, buf, {
      access: "public",
      addRandomSuffix: false,
      contentType: contentType || "application/octet-stream",
    });
    return blob.url;
  } catch (err) {
    console.warn(`  ! fetch/upload error for ${url}:`, err instanceof Error ? err.message : err);
    return null;
  }
}

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN && !dryRun) {
    console.error("Missing BLOB_READ_WRITE_TOKEN. Add it to .env (copy from Vercel project settings).");
    process.exit(1);
  }

  const prisma = new PrismaClient();
  let itemDone = 0, itemSkip = 0, itemFail = 0;
  let logoDone = 0, coverDone = 0;

  try {
    // ---- menu_items ----
    const items = await prisma.menuItem.findMany({
      where: { image: { not: null } },
      select: { id: true, cafeId: true, image: true },
    });
    console.log(`menu_items with images: ${items.length}`);

    for (const it of items) {
      const url = it.image as string;
      if (isVercelBlobUrl(url)) { itemSkip++; continue; }
      if (!isFirebaseUrl(url)) { itemSkip++; continue; }
      const fresh = await rehost(url, `products/${it.cafeId}/${it.id}`);
      if (!fresh) { itemFail++; continue; }
      if (!dryRun) {
        await prisma.menuItem.update({
          where: { id: it.id }, data: { image: fresh },
        });
      }
      itemDone++;
      if (itemDone % 20 === 0) console.log(`  ~ ${itemDone} items rehosted...`);
    }

    // ---- cafes.logo + cover_image ----
    const cafes = await prisma.cafe.findMany({
      where: { OR: [{ logo: { not: null } }, { coverImage: { not: null } }] },
      select: { id: true, logo: true, coverImage: true },
    });
    console.log(`cafes with images: ${cafes.length}`);

    for (const c of cafes) {
      if (c.logo && isFirebaseUrl(c.logo) && !isVercelBlobUrl(c.logo)) {
        const fresh = await rehost(c.logo, `cafes/${c.id}/logo`);
        if (fresh) {
          if (!dryRun) await prisma.cafe.update({ where: { id: c.id }, data: { logo: fresh } });
          logoDone++;
        }
      }
      if (c.coverImage && isFirebaseUrl(c.coverImage) && !isVercelBlobUrl(c.coverImage)) {
        const fresh = await rehost(c.coverImage, `cafes/${c.id}/cover`);
        if (fresh) {
          if (!dryRun) await prisma.cafe.update({ where: { id: c.id }, data: { coverImage: fresh } });
          coverDone++;
        }
      }
    }

    console.log("");
    console.log(`OK${dryRun ? " (dry run)" : ""}`);
    console.log(`  menu_items: rehosted=${itemDone} skipped=${itemSkip} failed=${itemFail}`);
    console.log(`  cafes.logo  rehosted=${logoDone}`);
    console.log(`  cafes.cover rehosted=${coverDone}`);
  } finally {
    await prisma.$disconnect();
  }
}

void main();

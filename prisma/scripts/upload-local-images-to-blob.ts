/**
 * prisma/scripts/upload-local-images-to-blob.ts
 *
 * Manual / offline counterpart to migrate-images-to-blob.ts.
 *
 * Use this when Firebase Storage is blocking downloads (HTTP 402 from the
 * Spark plan daily quota). You download the bytes yourself by any means
 * (Firebase Console, gsutil, gcloud, browser), drop them in a local folder
 * mirroring the Firebase path, and this script rehosts them on Vercel Blob.
 *
 * Expected folder layout (default ./firebase-export):
 *   firebase-export/
 *     products/
 *       <firestoreCafeId>/
 *         <filename>.png
 *         <filename>.jpg
 *         ...
 *
 * The script:
 *   1. Loads every menu_item row whose `image` looks like a Firebase URL.
 *   2. Parses the URL to extract the firestoreCafeId + filename
 *      (.../o/products%2F<cafeId>%2F<filename>?...)
 *   3. Looks for the file at ./firebase-export/products/<cafeId>/<filename>
 *   4. Uploads to Vercel Blob -> products/<postgresCafeId>/<postgresItemId>-<ts>.<ext>
 *   5. Updates Postgres menu_items.image to the new vercel-storage.com URL.
 *
 * Idempotent — skips rows already on vercel-storage.com.
 *
 * Usage:
 *   npx tsx prisma/scripts/upload-local-images-to-blob.ts             # default folder
 *   npx tsx prisma/scripts/upload-local-images-to-blob.ts --dir ./my-dump
 *   npx tsx prisma/scripts/upload-local-images-to-blob.ts --dry-run   # print plan only
 */

import "dotenv/config";
import { promises as fs } from "node:fs";
import path from "node:path";
import { put } from "@vercel/blob";
import { PrismaClient } from "@prisma/client";

function arg(name: string, fallback?: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  if (i >= 0 && i + 1 < process.argv.length) return process.argv[i + 1];
  return fallback;
}
const dryRun = process.argv.includes("--dry-run");
const root = arg("dir", "./firebase-export")!;

const FB_HOSTS = new Set([
  "firebasestorage.googleapis.com",
  "storage.googleapis.com",
]);

function isFirebaseUrl(u: string | null): boolean {
  if (!u) return false;
  try { return FB_HOSTS.has(new URL(u).host); } catch { return false; }
}
function isVercelBlobUrl(u: string | null): boolean {
  if (!u) return false;
  try {
    const h = new URL(u).host;
    return h.endsWith(".vercel-storage.com") || h.endsWith(".public.blob.vercel-storage.com");
  } catch { return false; }
}

/**
 * Pull the cafeId + filename out of a Firebase Storage v0 URL like
 *   https://firebasestorage.googleapis.com/v0/b/<bucket>/o/products%2F<cafe>%2F<file>?...
 */
function parseFirebasePath(url: string): { cafeFolder: string; filename: string } | null {
  try {
    const u = new URL(url);
    // path is /v0/b/<bucket>/o/<percent-encoded path>
    const m = u.pathname.match(/\/o\/(.+)$/);
    if (!m) return null;
    const decoded = decodeURIComponent(m[1]);
    // We expect 'products/<cafe>/<filename>' or possibly 'cafes/<cafe>/...'
    const parts = decoded.split("/");
    if (parts.length < 3) return null;
    const filename = parts[parts.length - 1];
    const cafeFolder = parts[parts.length - 2];
    return { cafeFolder, filename };
  } catch {
    return null;
  }
}

function inferContentType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  if (ext === "svg") return "image/svg+xml";
  return "application/octet-stream";
}

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN && !dryRun) {
    console.error("Missing BLOB_READ_WRITE_TOKEN. Add it to .env.");
    process.exit(1);
  }

  const absRoot = path.resolve(root);
  let exists = false;
  try { await fs.stat(absRoot); exists = true; } catch { /* not found */ }
  if (!exists) {
    console.error(`Folder not found: ${absRoot}`);
    console.error("Drop your downloaded Firebase files there first, in the structure:");
    console.error("  <dir>/products/<firestoreCafeId>/<filename>.png");
    process.exit(1);
  }
  console.log(`Reading local images from ${absRoot}`);

  const prisma = new PrismaClient();
  let done = 0, skip = 0, miss = 0, fail = 0;

  try {
    const items = await prisma.menuItem.findMany({
      where: { image: { not: null } },
      select: { id: true, cafeId: true, image: true, name: true },
    });
    console.log(`menu_items with images: ${items.length}`);

    for (const it of items) {
      const url = it.image as string;
      if (isVercelBlobUrl(url)) { skip++; continue; }
      if (!isFirebaseUrl(url)) { skip++; continue; }

      const parsed = parseFirebasePath(url);
      if (!parsed) { miss++; console.warn(`  ! cannot parse URL for item ${it.id}: ${url}`); continue; }

      // Try a few candidate paths under root:
      //   <root>/products/<cafeFolder>/<filename>
      //   <root>/<cafeFolder>/<filename>
      //   <root>/<filename>
      const candidates = [
        path.join(absRoot, "products", parsed.cafeFolder, parsed.filename),
        path.join(absRoot, parsed.cafeFolder, parsed.filename),
        path.join(absRoot, parsed.filename),
      ];

      let bytes: Buffer | null = null;
      let usedPath = "";
      for (const p of candidates) {
        try {
          bytes = await fs.readFile(p);
          usedPath = p;
          break;
        } catch { /* not at this candidate, try next */ }
      }
      if (!bytes) {
        miss++;
        console.warn(`  ! file not found for item ${it.id} (${it.name}): expected one of:`);
        for (const c of candidates) console.warn(`      ${c}`);
        continue;
      }

      const ext = parsed.filename.split(".").pop() ?? "jpg";
      const blobPath = `products/${it.cafeId}/${it.id}-${Date.now()}.${ext}`;
      const contentType = inferContentType(parsed.filename);

      if (dryRun) {
        console.log(`  (dry) ${usedPath} (${bytes.length} bytes) -> ${blobPath}`);
        done++;
        continue;
      }

      try {
        const blob = await put(blobPath, bytes, {
          access: "public",
          addRandomSuffix: false,
          contentType,
        });
        await prisma.menuItem.update({
          where: { id: it.id },
          data: { image: blob.url },
        });
        done++;
        if (done % 10 === 0) console.log(`  ~ ${done} done...`);
      } catch (err) {
        fail++;
        console.warn(`  ! upload error for item ${it.id}:`,
          err instanceof Error ? err.message : err);
      }
    }

    console.log("");
    console.log(`OK${dryRun ? " (dry run)" : ""}`);
    console.log(`  rehosted: ${done}`);
    console.log(`  skipped (already-Vercel or non-Firebase): ${skip}`);
    console.log(`  missing in local folder: ${miss}`);
    console.log(`  upload failed: ${fail}`);
  } finally {
    await prisma.$disconnect();
  }
}

void main();

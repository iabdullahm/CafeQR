/**
 * POST /api/upload/menu-image
 *
 * Upload a menu item image to Vercel Blob.
 *
 * Auth: JWT bearer required (cafe-admin / staff). The caller's cafeId from
 * the token is used as the folder prefix so tenants can't write into each
 * other's buckets.
 *
 * Request: multipart/form-data with field "file" (the image binary).
 *
 * Response: { success: true, data: { url: string, pathname: string } }
 *
 * Why a server endpoint instead of client SDK:
 *   - We do not want BLOB_READ_WRITE_TOKEN in the browser
 *   - Lets us enforce JWT auth, file-size cap, and cafe-scoped pathing
 */

import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { withAuth } from "@/middleware/auth-helpers";

// Allow up to 5MB — menu photos are small.
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export async function POST(req: Request) {
  return withAuth(req, null, async (user) => {
    try {
      const form = await req.formData();
      const file = form.get("file");

      if (!(file instanceof File)) {
        return NextResponse.json(
          { success: false, message: "Missing 'file' field" },
          { status: 400 }
        );
      }
      if (file.size > MAX_BYTES) {
        return NextResponse.json(
          { success: false, message: `File too large (max ${MAX_BYTES / 1024 / 1024}MB)` },
          { status: 413 }
        );
      }
      if (!ALLOWED_TYPES.has(file.type)) {
        return NextResponse.json(
          { success: false, message: `Unsupported type: ${file.type}` },
          { status: 415 }
        );
      }

      // Folder pathing: scope by cafeId so tenants are isolated.
      const cafeId = user.cafeId || "shared";
      const extMatch = file.name.match(/\.([a-zA-Z0-9]+)$/);
      const ext = extMatch ? extMatch[1].toLowerCase() : "jpg";
      const pathname = `products/${cafeId}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}.${ext}`;

      const blob = await put(pathname, file, {
        access: "public",
        addRandomSuffix: false,
        contentType: file.type,
      });

      return NextResponse.json({
        success: true,
        data: {
          url: blob.url,
          pathname: blob.pathname,
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("[/api/upload/menu-image] error:", msg);
      return NextResponse.json(
        { success: false, message: "Upload failed" },
        { status: 500 }
      );
    }
  });
}

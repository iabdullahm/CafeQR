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
 * Response: { success: true, data: { url, pathname } }
 *           { success: false, message, debug? } on failure (real reason
 *                                                surfaced to the owner)
 */

import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { withAuth } from "@/middleware/auth-helpers";

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

      // SECURITY: previously fell back to "shared" if the JWT had no
      // cafeId, so every such caller wrote to the SAME folder. Refuse
      // the upload — only valid path is a tenant upload (SUPER_ADMIN
      // must impersonate a cafe first).
      if (!user.cafeId) {
        return NextResponse.json(
          { success: false, message: "Your account has no cafe assigned. Switch to a cafe before uploading images." },
          { status: 403 }
        );
      }
      const cafeId = user.cafeId;
      const extMatch = file.name.match(/\.([a-zA-Z0-9]+)$/);
      const ext = extMatch ? extMatch[1].toLowerCase() : "jpg";
      const pathname = `products/${cafeId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const blob = await put(pathname, file, {
        access: "public",
        addRandomSuffix: false,
        contentType: file.type,
      });

      return NextResponse.json({
        success: true,
        data: { url: blob.url, pathname: blob.pathname },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      const stack = err instanceof Error ? err.stack : undefined;
      console.error("[/api/upload/menu-image] error:", msg, stack);
      const hasToken = !!process.env.BLOB_READ_WRITE_TOKEN;
      return NextResponse.json(
        { success: false, message: `Upload failed: ${msg}`, debug: { hasToken } },
        { status: 500 }
      );
    }
  });
}

/**
 * POST /api/admin/seed-firestore
 *
 * One-shot seed for the customer-ordering Firestore documents. Used as a
 * workaround when the org policy `iam.disableServiceAccountKeyCreation`
 * blocks downloading the service-account JSON locally — this endpoint
 * runs server-side on Vercel where FIREBASE_SERVICE_ACCOUNT_KEY is
 * already configured.
 *
 * Auth: requires `Authorization: Bearer <ADMIN_SEED_TOKEN>` matching the
 * env var of the same name. The token must be random and >= 32 chars.
 *
 * Usage:
 *   curl -X POST https://www.cafe-qr.com/api/admin/seed-firestore \
 *        -H "Authorization: Bearer $ADMIN_SEED_TOKEN"
 *
 * Idempotent: uses set({merge:true}) so re-running is safe.
 *
 * Delete this endpoint (or remove the file) once Firestore is seeded —
 * it grants broad write access and should not stay in production.
 */

import { NextResponse } from "next/server";
import { getAdminDb, FieldValue } from "@/lib/firebase-admin";

const CAFE_ID = process.env.SEED_CAFE_ID || "1";
const TABLE_ID = process.env.SEED_TABLE_ID || "1";

// Same payload as scripts/seed-firestore.mjs — kept in sync.
const cafeProfile = {
  name: "Demo Cafe",
  nameAr: "كافيه تجريبي",
  branchName: "Main Branch",
  logo: "https://picsum.photos/seed/logo/150/150",
  coverImage:
    "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=800&fit=crop",
  currency: "OMR",
  rating: 4.9,
  isActive: true,
  city: "Muscat",
  country: "OM",
};

const settings = {
  taxes: { vat: "5" },
  activeOrderTypes: { dineIn: true, carService: true, pickup: true },
};

const products = [
  {
    id: "p-spanish-latte",
    name: "Spanish Latte",
    description: "Rich espresso with sweetened condensed milk",
    price: 2.5,
    imageUrl:
      "https://images.unsplash.com/photo-1485808191679-5f86510681a2?q=80&w=400&fit=crop",
    category: "hot_drinks",
    isPopular: true,
    available: true,
  },
  {
    id: "p-v60-drip",
    name: "V60 Drip",
    description: "Single-origin pour-over coffee",
    price: 3.2,
    imageUrl:
      "https://images.unsplash.com/photo-1495474472205-1627370a8f8e?q=80&w=400&fit=crop",
    category: "hot_drinks",
    isPopular: false,
    available: true,
  },
  {
    id: "p-iced-latte",
    name: "Iced Latte",
    description: "Espresso over ice with cold milk",
    price: 2.8,
    imageUrl:
      "https://images.unsplash.com/photo-1517701604599-bb29b565090c?q=80&w=400&fit=crop",
    category: "cold_drinks",
    isPopular: true,
    available: true,
  },
  {
    id: "p-cold-brew",
    name: "Cold Brew",
    description: "Slow-steeped 18 hours, smooth and bold",
    price: 3.0,
    imageUrl:
      "https://images.unsplash.com/photo-1517701604599-bb29b565090c?q=80&w=400&fit=crop",
    category: "cold_brew",
    isPopular: false,
    available: true,
  },
];

const tables = [
  { id: TABLE_ID, name: `Table ${TABLE_ID}`, seats: 4, status: "available" },
];

function unauthorized(): NextResponse {
  return NextResponse.json(
    { success: false, message: "Unauthorized" },
    { status: 401 }
  );
}

export async function POST(req: Request) {
  // ----- Auth -----
  const expected = process.env.ADMIN_SEED_TOKEN;
  if (!expected || expected.length < 32) {
    // Refuse to operate if no strong token is configured.
    return NextResponse.json(
      {
        success: false,
        message:
          "ADMIN_SEED_TOKEN env var not set or too short (need >= 32 chars).",
      },
      { status: 503 }
    );
  }
  const auth = req.headers.get("authorization") ?? "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m || m[1] !== expected) return unauthorized();

  // ----- Seed -----
  try {
    const db = getAdminDb();
    const ts = FieldValue.serverTimestamp();
    const cafeRef = db.collection("cafes").doc(CAFE_ID);

    // 1. Cafe profile
    await cafeRef.set(
      { ...cafeProfile, createdAt: ts, updatedAt: ts },
      { merge: true }
    );

    // 2. Settings
    await cafeRef
      .collection("config")
      .doc("settings")
      .set({ ...settings, updatedAt: ts }, { merge: true });

    // 3. Products (batch)
    const batch = db.batch();
    for (const p of products) {
      batch.set(cafeRef.collection("products").doc(p.id), p, { merge: true });
    }
    await batch.commit();

    // 4. Tables
    for (const t of tables) {
      await cafeRef.collection("tables").doc(t.id).set(t, { merge: true });
    }

    return NextResponse.json({
      success: true,
      seeded: {
        cafeId: CAFE_ID,
        products: products.length,
        tables: tables.length,
      },
      testUrl: `/c/${CAFE_ID}/1/${TABLE_ID}`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[seed-firestore] error:", err);
    return NextResponse.json(
      { success: false, message: msg },
      { status: 500 }
    );
  }
}

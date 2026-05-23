#!/usr/bin/env node
/**
 * One-shot Firestore seed for the customer ordering flow.
 *
 * The page at /c/[cafeId]/[branchId]/[tableId] reads from Firestore
 * (not Postgres/Neon), so the Prisma seed alone is not enough. This
 * script writes the matching documents to Firestore using the Firebase
 * Admin SDK (which bypasses Firestore Security Rules with the service
 * account, so this works regardless of the public rules).
 *
 * Structure created:
 *   /cafes/{cafeId}                       — cafe profile doc
 *   /cafes/{cafeId}/config/settings       — tax & order type config
 *   /cafes/{cafeId}/products/{productId}  — menu items
 *   /cafes/{cafeId}/tables/{tableId}      — tables
 *
 * Required env:
 *   FIREBASE_SERVICE_ACCOUNT_KEY  (single-line JSON, same one used by /lib/firebase-admin.ts)
 *
 * Optional env:
 *   SEED_CAFE_ID       (default: "1")
 *   SEED_BRANCH_ID     (default: "1")
 *   SEED_TABLE_ID      (default: "1")
 *
 * Run locally:
 *   node scripts/seed-firestore.mjs
 *
 * After running, open:
 *   https://www.cafe-qr.com/c/1/1/1
 * — the cafe should now be "Demo Cafe" with 4 menu items visible.
 */

import "dotenv/config";
import admin from "firebase-admin";

// ---------- Config ----------
const CAFE_ID = process.env.SEED_CAFE_ID || "1";
const BRANCH_ID = process.env.SEED_BRANCH_ID || "1";
const TABLE_ID = process.env.SEED_TABLE_ID || "1";

const SA_RAW = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!SA_RAW) {
  console.error(
    "ERROR: FIREBASE_SERVICE_ACCOUNT_KEY env var not set.\n" +
      "       It must be the single-line JSON of your service account."
  );
  process.exit(1);
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(SA_RAW);
} catch (e) {
  console.error("ERROR: FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON:", e.message);
  process.exit(1);
}

// ---------- Init Admin SDK ----------
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
}
const db = admin.firestore();

// ---------- Data ----------
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
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
};

const settings = {
  taxes: { vat: "5" }, // 5% VAT — set "0" to disable
  activeOrderTypes: { dineIn: true, carService: true, pickup: true },
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
};

// Menu items — categoryId must match /c/.../page.tsx CATEGORIES list
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

// ---------- Write ----------
async function main() {
  console.log(`Seeding Firestore for cafe ${CAFE_ID}...`);

  // 1. Cafe profile
  await db.collection("cafes").doc(CAFE_ID).set(cafeProfile, { merge: true });
  console.log(`  ✓ /cafes/${CAFE_ID}`);

  // 2. Config
  await db
    .collection("cafes")
    .doc(CAFE_ID)
    .collection("config")
    .doc("settings")
    .set(settings, { merge: true });
  console.log(`  ✓ /cafes/${CAFE_ID}/config/settings`);

  // 3. Products
  const batch = db.batch();
  for (const p of products) {
    const ref = db.collection("cafes").doc(CAFE_ID).collection("products").doc(p.id);
    batch.set(ref, p, { merge: true });
  }
  await batch.commit();
  console.log(`  ✓ /cafes/${CAFE_ID}/products/  (${products.length} items)`);

  // 4. Tables
  for (const t of tables) {
    await db
      .collection("cafes")
      .doc(CAFE_ID)
      .collection("tables")
      .doc(t.id)
      .set(t, { merge: true });
  }
  console.log(`  ✓ /cafes/${CAFE_ID}/tables/    (${tables.length} tables)`);

  console.log("");
  console.log("Done. Test with:");
  console.log(`  https://www.cafe-qr.com/c/${CAFE_ID}/${BRANCH_ID}/${TABLE_ID}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });

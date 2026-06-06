/**
 * prisma/scripts/migrate-firestore-cafes.ts
 *
 * One-shot migration: copy /cafes and /cafes/{id}/products from Firestore
 * to Postgres. Idempotent — re-running upserts.
 *
 * What it does NOT do (Phase 3 will):
 *   - Migrate image bytes. Image URLs are preserved as-is, so existing
 *     Firebase Storage URLs keep working until we re-host them on
 *     Vercel Blob.
 *
 * Usage:
 *   DATABASE_URL=postgres://...  npx tsx prisma/scripts/migrate-firestore-cafes.ts
 */

import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { PrismaClient } from "@prisma/client";

import { firebaseConfig } from "../../src/firebase/config";

type AnyDoc = Record<string, unknown>;

function s(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  return String(v).trim() || null;
}

function n(v: unknown): number | null {
  if (v === undefined || v === null || v === "") return null;
  const x = Number(v);
  return Number.isFinite(x) ? x : null;
}

async function main() {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  const fs = getFirestore(app);
  const prisma = new PrismaClient();

  let cafeOk = 0;
  let cafeFail = 0;
  let catTotal = 0;
  let itemTotal = 0;

  try {
    const cafesSnap = await getDocs(collection(fs, "cafes"));
    console.log(`Found ${cafesSnap.size} cafe docs in Firestore.`);

    for (const cafeDoc of cafesSnap.docs) {
      const d = cafeDoc.data() as AnyDoc;
      const firestoreId = cafeDoc.id;

      // Pick a deterministic Postgres slug + cafeCode from the doc id.
      const slug = s(d.slug) || firestoreId;
      const cafeCode = s(d.cafeCode) || `IMP-${firestoreId.toUpperCase().slice(0, 10)}`;
      const name = s(d.name) || "Unnamed Cafe";

      try {
        // Match an existing Postgres row by slug, cafeCode, or numeric
        // firestoreId. Otherwise create a new one.
        let pg = await prisma.cafe.findFirst({
          where: { OR: [{ slug }, { cafeCode }] },
        });

        const payload = {
          name,
          nameAr: s(d.nameAr ?? d.name_ar),
          slug,
          cafeCode,
          logo: s(d.logo),
          coverImage: s(d.coverImage ?? d.cover_image),
          description: s(d.description),
          descriptionAr: s(d.descriptionAr ?? d.description_ar),
          phone: s(d.phone),
          email: s(d.email),
          country: s(d.country),
          city: s(d.city),
          address: s(d.address),
          currency: s(d.currency) || "OMR",
          timezone: s(d.timezone) || "Asia/Muscat",
          taxRate: n(d.taxRate) ?? 0,
          settings: (d.settings as object) ?? null,
        };

        if (!pg) {
          pg = await prisma.cafe.create({ data: payload });
          console.log(`  + created cafe '${name}' as id=${pg.id}`);
        } else {
          pg = await prisma.cafe.update({
            where: { id: pg.id },
            data: {
              name: payload.name,
              nameAr: payload.nameAr,
              logo: payload.logo,
              coverImage: payload.coverImage,
              description: payload.description,
              descriptionAr: payload.descriptionAr,
              phone: payload.phone,
              email: payload.email,
              country: payload.country,
              city: payload.city,
              address: payload.address,
              currency: payload.currency,
              timezone: payload.timezone,
              taxRate: payload.taxRate,
              settings: payload.settings,
            },
          });
          console.log(`  ~ updated cafe '${name}' (id=${pg.id})`);
        }

        // ---- Products ----
        let productsSnap;
        try {
          productsSnap = await getDocs(collection(fs, "cafes", firestoreId, "products"));
        } catch {
          productsSnap = null;
        }

        if (productsSnap && productsSnap.size > 0) {
          // First pass: build category map from any string `category` value
          // that appears on items but is not a numeric Postgres id.
          const seenCategoryKeys = new Set<string>();
          for (const p of productsSnap.docs) {
            const pd = p.data() as AnyDoc;
            const key = s(pd.category ?? pd.categoryId);
            if (key && !/^\d+$/.test(key)) seenCategoryKeys.add(key);
          }

          const categoryIdByKey = new Map<string, bigint>();
          for (const key of seenCategoryKeys) {
            const existing = await prisma.menuCategory.findFirst({
              where: { cafeId: pg.id, name: key },
            });
            if (existing) {
              categoryIdByKey.set(key, existing.id);
            } else {
              const newCat = await prisma.menuCategory.create({
                data: {
                  cafeId: pg.id,
                  name: key,
                  status: "active",
                },
              });
              categoryIdByKey.set(key, newCat.id);
              catTotal++;
            }
          }

          // Fallback "General" category for items with no category key.
          let fallbackCatId: bigint | null = null;
          const needFallback = productsSnap.docs.some((p) => {
            const k = s((p.data() as AnyDoc).category ?? (p.data() as AnyDoc).categoryId);
            return !k;
          });
          if (needFallback) {
            const fb = await prisma.menuCategory.findFirst({
              where: { cafeId: pg.id, name: "General" },
            });
            fallbackCatId = fb
              ? fb.id
              : (await prisma.menuCategory.create({
                  data: { cafeId: pg.id, name: "General", status: "active" },
                })).id;
            if (!fb) catTotal++;
          }

          // Second pass: items.
          for (const p of productsSnap.docs) {
            const pd = p.data() as AnyDoc;
            const key = s(pd.category ?? pd.categoryId);
            let categoryId: bigint;
            if (key && /^\d+$/.test(key)) {
              categoryId = BigInt(key);
            } else if (key && categoryIdByKey.has(key)) {
              categoryId = categoryIdByKey.get(key)!;
            } else if (fallbackCatId) {
              categoryId = fallbackCatId;
            } else {
              continue;
            }

            const name = s(pd.nameEn ?? pd.name) || "Unnamed";
            const existing = await prisma.menuItem.findFirst({
              where: { cafeId: pg.id, name, categoryId },
            });

            const data = {
              cafeId: pg.id,
              categoryId,
              name,
              nameAr: s(pd.nameAr) ?? null,
              description: s(pd.descriptionEn ?? pd.description ?? pd.ingredients),
              descriptionAr: s(pd.descriptionAr) ?? null,
              image: s(pd.imageUrl ?? pd.image),
              price: n(pd.price) ?? 0,
              isFeatured: !!pd.isPopular || !!pd.isFeatured,
              isAvailable: pd.isAvailable !== false,
              optionsData: (pd.options as object) ?? [],
              status: "active",
            };

            if (existing) {
              await prisma.menuItem.update({ where: { id: existing.id }, data });
            } else {
              await prisma.menuItem.create({ data });
              itemTotal++;
            }
          }
        }

        cafeOk++;
      } catch (err) {
        cafeFail++;
        console.error(`  ! failed cafe '${name}':`, err instanceof Error ? err.message : err);
      }
    }

    console.log("");
    console.log(`OK — cafes: ${cafeOk} migrated, ${cafeFail} failed`);
    console.log(`     categories added: ${catTotal}`);
    console.log(`     items added: ${itemTotal}`);
  } finally {
    await prisma.$disconnect();
  }
}

void main();

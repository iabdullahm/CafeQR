/**
 * prisma/scripts/migrate-firestore-tables.ts
 *
 * Copy /cafes/{cafeId}/tables + /cafes/{cafeId}/branches from Firestore
 * to Postgres. QR codes are generated on the fly since their tokens are
 * server-side.
 *
 * Idempotent. Run after rules are relaxed.
 *
 *   npx tsx prisma/scripts/migrate-firestore-tables.ts
 */

import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { randomBytes } from "node:crypto";
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

  let branchesAdded = 0;
  let tablesAdded = 0;
  let qrAdded = 0;

  try {
    const cafesSnap = await getDocs(collection(fs, "cafes"));
    console.log(`Scanning ${cafesSnap.size} cafes for branches + tables...`);

    for (const cafeDoc of cafesSnap.docs) {
      const fsCafeId = cafeDoc.id;
      const cd = cafeDoc.data() as AnyDoc;
      const slug = s(cd.slug) || fsCafeId;
      const cafeCode = s(cd.cafeCode) || `IMP-${fsCafeId.toUpperCase().slice(0, 10)}`;
      const pgCafe = await prisma.cafe.findFirst({
        where: { OR: [{ slug }, { cafeCode }] },
        select: { id: true, name: true },
      });
      if (!pgCafe) {
        console.log(`  skip ${fsCafeId} (not in Postgres)`);
        continue;
      }

      // ---- branches ----
      try {
        const bSnap = await getDocs(collection(fs, "cafes", fsCafeId, "branches"));
        for (const b of bSnap.docs) {
          const bd = b.data() as AnyDoc;
          const name = s(bd.name) || b.id;
          const branchCode = s(bd.code) || `BR-${b.id.slice(0, 6).toUpperCase()}`;
          const existing = await prisma.cafeBranch.findFirst({
            where: { cafeId: pgCafe.id, branchCode },
          });
          if (!existing) {
            await prisma.cafeBranch.create({
              data: {
                cafeId: pgCafe.id,
                branchCode,
                name,
                phone: s(bd.phone),
                email: s(bd.email),
                city: s(bd.city),
                address: s(bd.address),
                status: (s(bd.status) ?? "active").toLowerCase(),
              },
            });
            branchesAdded++;
          }
        }
      } catch (err) {
        console.warn(`  ! branches '${fsCafeId}':`, err instanceof Error ? err.message : err);
      }

      // ---- tables (and QR codes) ----
      // Pick any branch in this cafe for the default branchId.
      const defaultBranch = await prisma.cafeBranch.findFirst({
        where: { cafeId: pgCafe.id },
      });
      if (!defaultBranch) continue;

      try {
        const tSnap = await getDocs(collection(fs, "cafes", fsCafeId, "tables"));
        for (const t of tSnap.docs) {
          const td = t.data() as AnyDoc;
          const tableNumber = String(td.number ?? td.tableNumber ?? t.id).slice(0, 10);
          const tableName = s(td.name) || null;
          // Try to find by tableNumber+branch
          const existing = await prisma.cafeTable.findFirst({
            where: {
              cafeId: pgCafe.id,
              branchId: defaultBranch.id,
              tableNumber,
            },
          });
          if (existing) continue;

          const newTable = await prisma.cafeTable.create({
            data: {
              cafeId: pgCafe.id,
              branchId: defaultBranch.id,
              tableNumber,
              tableName,
              seatsCount: n(td.seatsCount) ?? 2,
            },
          });
          tablesAdded++;

          // Generate a QR code row
          const token = randomBytes(16).toString("hex");
          const code = `QR-${pgCafe.id}-${defaultBranch.id}-${newTable.id}`;
          const url = `https://cafe-qr.com/c/${pgCafe.id}/${defaultBranch.id}/${newTable.id}?t=${token}`;
          const qr = await prisma.qRCode.create({
            data: {
              cafeId: pgCafe.id,
              branchId: defaultBranch.id,
              tableId: newTable.id,
              qrType: "table",
              code,
              token,
              url,
            },
          });
          await prisma.cafeTable.update({
            where: { id: newTable.id },
            data: { qrCodeId: qr.id },
          });
          qrAdded++;
        }
      } catch (err) {
        console.warn(`  ! tables '${fsCafeId}':`, err instanceof Error ? err.message : err);
      }
    }

    console.log("");
    console.log(`OK`);
    console.log(`  branches added: ${branchesAdded}`);
    console.log(`  tables added: ${tablesAdded}`);
    console.log(`  qr codes added: ${qrAdded}`);
  } finally {
    await prisma.$disconnect();
  }
}

void main();

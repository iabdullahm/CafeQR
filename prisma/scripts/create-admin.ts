/**
 * prisma/scripts/create-admin.ts
 *
 * Seed (or update) a Postgres admin account with the SUPER_ADMIN role.
 *
 * Usage:
 *   npx tsx prisma/scripts/create-admin.ts <email> <password> [fullName]
 *
 * Example:
 *   npx tsx prisma/scripts/create-admin.ts you@example.com 'YourStrongPass!2026' 'Abdullah'
 *
 * Idempotent — re-running with a new password updates the hash in place.
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

async function main() {
  const [, , emailArg, passwordArg, fullNameArg] = process.argv;

  if (!emailArg || !passwordArg) {
    console.error(
      "Usage: npx tsx prisma/scripts/create-admin.ts <email> <password> [fullName]"
    );
    process.exit(1);
  }

  const email = emailArg.toLowerCase().trim();
  const password = passwordArg;
  const fullName = fullNameArg ?? email.split("@")[0];

  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    // 1. Ensure the SUPER_ADMIN role row exists.
    const role = await prisma.role.upsert({
      where: { name: "SUPER_ADMIN" },
      update: {},
      create: {
        name: "SUPER_ADMIN",
        displayName: "Platform Administrator",
      },
    });

    // 2. Upsert the user with the new password hash.
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.upsert({
      where: { email },
      update: { passwordHash, fullName, status: "active" },
      create: {
        email,
        fullName,
        passwordHash,
        status: "active",
      },
    });

    // 3. Grant SUPER_ADMIN role (idempotent).
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: role.id } },
      update: {},
      create: { userId: user.id, roleId: role.id },
    });

    console.log("OK");
    console.log("  user.id       :", String(user.id));
    console.log("  email         :", user.email);
    console.log("  fullName      :", user.fullName);
    console.log("  role          : SUPER_ADMIN");
    console.log("");
    console.log("You can now sign in at /login with this email + password.");
  } catch (err) {
    console.error("Failed:", err instanceof Error ? err.message : err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

void main();

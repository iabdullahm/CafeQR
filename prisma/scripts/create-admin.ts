/**
 * prisma/scripts/create-admin.ts
 *
 * Seed (or update) a Postgres user with a chosen role and optional cafe scope.
 *
 * Usage:
 *   npx tsx prisma/scripts/create-admin.ts --email <email> --password <password>
 *     [--name <full name>] [--role <SUPER_ADMIN|OWNER|MANAGER|CASHIER|KITCHEN>]
 *     [--cafe <numeric id | cafeCode | slug>]
 *
 * Examples:
 *   # Platform super-admin (no cafe scope)
 *   npx tsx prisma/scripts/create-admin.ts \
 *     --email me@x.com --password 'Pass!2026'
 *
 *   # Cafe owner of Demo Cafe (id 1)
 *   npx tsx prisma/scripts/create-admin.ts \
 *     --email owner@blue.com --password 'Owner!2026' --role OWNER --cafe 1
 *
 *   # Owner of cafe by code
 *   npx tsx prisma/scripts/create-admin.ts \
 *     --email owner@blue.com --password 'Owner!2026' --role OWNER --cafe BLUECOAST
 *
 * Idempotent — re-running updates the password hash + role link in place.
 *
 * For OWNER role: the script sets Cafe.ownerUserId so the cafe-admin
 * dashboard scopes correctly.
 * For MANAGER/CASHIER/KITCHEN: the script adds a row in cafe_users to
 * link the user as staff.
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

type Args = {
  email?: string;
  password?: string;
  name?: string;
  role?: string;
  cafe?: string;
};

function parseArgs(argv: string[]): Args {
  const out: Args = {};
  for (let i = 2; i < argv.length; i++) {
    const k = argv[i];
    const v = argv[i + 1];
    if (k === "--email") { out.email = v; i++; }
    else if (k === "--password") { out.password = v; i++; }
    else if (k === "--name") { out.name = v; i++; }
    else if (k === "--role") { out.role = v?.toUpperCase(); i++; }
    else if (k === "--cafe") { out.cafe = v; i++; }
  }
  // Backwards-compatible positional form: <email> <password> [name]
  if (!out.email && argv[2] && !argv[2].startsWith("--")) {
    out.email = argv[2];
    out.password = argv[3];
    out.name = argv[4];
  }
  return out;
}

const VALID_ROLES = new Set([
  "SUPER_ADMIN", "OWNER", "MANAGER", "CASHIER", "KITCHEN",
]);

async function main() {
  const args = parseArgs(process.argv);

  if (!args.email || !args.password) {
    console.error("Missing required args.");
    console.error("Usage: npx tsx prisma/scripts/create-admin.ts --email <email> --password <password> [--name <name>] [--role <ROLE>] [--cafe <id|code|slug>]");
    process.exit(1);
  }
  const email = args.email.toLowerCase().trim();
  const password = args.password;
  const fullName = args.name ?? email.split("@")[0];
  const role = (args.role ?? "SUPER_ADMIN").toUpperCase();

  if (!VALID_ROLES.has(role)) {
    console.error(`Invalid role '${role}'. Must be one of: ${[...VALID_ROLES].join(", ")}`);
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }
  if ((role === "OWNER" || role === "MANAGER" || role === "CASHIER" || role === "KITCHEN") && !args.cafe) {
    console.error(`Role ${role} requires --cafe <id|code|slug>`);
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    // 1. Ensure the role row exists.
    const displayNames: Record<string, string> = {
      SUPER_ADMIN: "Platform Administrator",
      OWNER: "Cafe Owner",
      MANAGER: "Cafe Manager",
      CASHIER: "Cashier",
      KITCHEN: "Kitchen Staff",
    };
    const roleRow = await prisma.role.upsert({
      where: { name: role },
      update: {},
      create: { name: role, displayName: displayNames[role] ?? role },
    });

    // 2. Upsert the user.
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.upsert({
      where: { email },
      update: { passwordHash, fullName, status: "active" },
      create: { email, fullName, passwordHash, status: "active" },
    });

    // 3. Grant the role.
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: roleRow.id } },
      update: {},
      create: { userId: user.id, roleId: roleRow.id },
    });

    // 4. Resolve cafe + link if cafe-scoped role.
    let cafeIdStr: string | null = null;
    if (args.cafe) {
      let cafe = null;
      if (/^\d+$/.test(args.cafe)) {
        try {
          cafe = await prisma.cafe.findUnique({ where: { id: BigInt(args.cafe) } });
        } catch { /* ignore */ }
      }
      if (!cafe) {
        cafe = await prisma.cafe.findFirst({ where: { cafeCode: args.cafe } });
      }
      if (!cafe) {
        cafe = await prisma.cafe.findFirst({ where: { slug: args.cafe } });
      }
      if (!cafe) {
        console.error(`Cafe '${args.cafe}' not found (tried numeric id, cafeCode, slug).`);
        process.exit(1);
      }
      cafeIdStr = String(cafe.id);

      if (role === "OWNER") {
        // Set Cafe.ownerUserId so the JWT login can resolve cafeId.
        await prisma.cafe.update({
          where: { id: cafe.id },
          data: { ownerUserId: user.id },
        });
      } else {
        // Staff link.
        const existing = await prisma.cafeUser.findFirst({
          where: { userId: user.id, cafeId: cafe.id },
        });
        if (!existing) {
          await prisma.cafeUser.create({
            data: { userId: user.id, cafeId: cafe.id, roleId: roleRow.id },
          });
        }
      }
    }

    console.log("OK");
    console.log("  user.id   :", String(user.id));
    console.log("  email     :", user.email);
    console.log("  fullName  :", user.fullName);
    console.log("  role      :", role);
    if (cafeIdStr) console.log("  cafeId    :", cafeIdStr);
    console.log("");
    console.log("Sign in at /login with this email + password.");
  } catch (err) {
    console.error("Failed:", err instanceof Error ? err.message : err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

void main();

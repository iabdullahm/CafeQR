
import { signToken } from '../../utils/jwt';
import prisma from '../../config/prisma';
import bcrypt from 'bcryptjs';

/**
 * @fileOverview Auth Service handles the logic for user login and retrieval.
 */

/**
 * Optional dev-only seed accounts.
 *
 * Reads SEED_ADMIN_EMAIL + SEED_ADMIN_PASSWORD_HASH from env. Both must be set,
 * and NODE_ENV must NOT be 'production'. The hash must be a bcrypt hash —
 * never a plaintext password — so the secret value is never compared as a
 * string literal and can't leak via a code search.
 *
 * To use locally:
 *   node -e "console.log(require('bcryptjs').hashSync('YourStrongPassword', 10))"
 *   then add to .env (NEVER commit):
 *     SEED_ADMIN_EMAIL=you@example.com
 *     SEED_ADMIN_PASSWORD_HASH=$2a$10$...
 */
async function tryDevSeedLogin(
  normalizedEmail: string,
  password: string
): Promise<{ token: string; user: any } | null> {
  if (process.env.NODE_ENV === 'production') return null;

  const seedEmail = (process.env.SEED_ADMIN_EMAIL ?? '').toLowerCase().trim();
  const seedHash = process.env.SEED_ADMIN_PASSWORD_HASH ?? '';
  if (!seedEmail || !seedHash) return null;
  if (normalizedEmail !== seedEmail) return null;

  const ok = await bcrypt.compare(password, seedHash);
  if (!ok) return null;

  // Use a sentinel ID that cannot collide with a real DB row.
  const user = {
    id: DEV_SEED_USER_ID,
    full_name: 'Dev Seed Admin',
    email: normalizedEmail,
    roles: ['SUPER_ADMIN'],
  };
  const token = signToken({ sub: user.id, email: user.email, roles: user.roles });
  return { token, user };
}

const DEV_SEED_USER_ID = '__dev_seed_admin__';

export const loginUser = async ({ email, password, isFirebaseSynced }: any) => {
  const normalizedEmail = email.toLowerCase().trim();

  // 1. Dev-only seed account (gated by NODE_ENV + env vars).
  //    Production builds never reach this branch.
  const seed = await tryDevSeedLogin(normalizedEmail, password);
  if (seed) return seed;

  // 2. Real Database Authentication
  try {
    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user && isFirebaseSynced) {
      try {
        const hashedPassword = await bcrypt.hash(password, 10);
        user = await prisma.user.create({
          data: {
            fullName: email.split('@')[0],
            email: normalizedEmail,
            passwordHash: hashedPassword,
            status: 'active'
          }
        });
        
        let targetRole = await prisma.role.findFirst({ where: { name: 'OWNER' } });
        if (!targetRole) {
           targetRole = await prisma.role.findFirst({ where: { name: 'staff' } });
        }
        
        if (targetRole) {
          await prisma.userRole.create({
            data: { userId: user.id, roleId: targetRole.id }
          });
        }
      } catch (provisionErr: any) {
        console.warn('Failed to auto-provision Postgres user during JWT sync:', provisionErr);
      }
    }

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Handle both snake_case and camelCase for flexible schema mapping
    const hash = (user as any).password_hash || (user as any).passwordHash;
    
    if (!hash) {
      throw new Error('User account configuration error: missing password hash');
    }

    const isPasswordValid = await bcrypt.compare(password, hash);

    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    const userRoles = await prisma.userRole.findMany({
      where: { userId: user.id },
      include: {
        role: true
      }
    });

    const roles = userRoles.length > 0 
      ? userRoles.map((item: any) => item.role.name)
      : ['staff']; // Default role if none assigned

    // Resolve cafeId for cafe-scoped roles. Owners are linked via
    // Cafe.ownerUserId. Managers/cashiers/kitchen via CafeUser. SUPER_ADMIN
    // has no cafeId.
    let cafeId: string | null = null;
    if (!roles.includes('SUPER_ADMIN')) {
      const ownedCafe = await prisma.cafe.findFirst({
        where: { ownerUserId: user.id },
        select: { id: true },
      });
      if (ownedCafe) {
        cafeId = String(ownedCafe.id);
      } else {
        const staffLink = await prisma.cafeUser.findFirst({
          where: { userId: user.id },
          select: { cafeId: true },
        });
        if (staffLink) cafeId = String(staffLink.cafeId);
      }
    }

    const token = signToken({
      sub: String(user.id),
      email: user.email,
      roles,
      ...(cafeId ? { cafeId } : {}),
    });

    return {
      token,
      user: {
        id: String(user.id),
        full_name: user.fullName,
        email: user.email,
        roles,
        cafeId,
      }
    };
  } catch (error: any) {
    // If Prisma fails (e.g. database not ready), we still want the error to be meaningful
    if (error.code) {
      throw new Error(`Database error: ${error.code}`);
    }
    throw error;
  }
};

export const getCurrentUser = async (userId: string) => {
  // Dev-only seed admin (matches the sentinel ID issued by tryDevSeedLogin).
  // Production builds never reach this branch because tryDevSeedLogin is gated.
  if (
    process.env.NODE_ENV !== 'production' &&
    userId === DEV_SEED_USER_ID &&
    process.env.SEED_ADMIN_EMAIL
  ) {
    return {
      id: userId,
      full_name: 'Dev Seed Admin',
      email: process.env.SEED_ADMIN_EMAIL,
      roles: ['SUPER_ADMIN'],
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: BigInt(userId) }
  });

  if (!user) throw new Error('User not found');

  const userRoles = await prisma.userRole.findMany({
    where: { userId: user.id },
    include: {
      role: true
    }
  });

  const roleNames: string[] = userRoles.map((item: any) => item.role.name);

  // Resolve cafe scope for non-SUPER_ADMIN users.
  let cafeId: string | null = null;
  if (!roleNames.includes('SUPER_ADMIN')) {
    const ownedCafe = await prisma.cafe.findFirst({
      where: { ownerUserId: user.id },
      select: { id: true },
    });
    if (ownedCafe) {
      cafeId = String(ownedCafe.id);
    } else {
      const staffLink = await prisma.cafeUser.findFirst({
        where: { userId: user.id },
        select: { cafeId: true },
      });
      if (staffLink) cafeId = String(staffLink.cafeId);
    }
  }

  return {
    id: String(user.id),
    full_name: user.fullName,
    email: user.email,
    roles: roleNames,
    cafeId,
  };
};

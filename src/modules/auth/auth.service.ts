
import { signToken } from '../../utils/jwt';
import prisma from '../../config/prisma';
import bcrypt from 'bcryptjs';

/**
 * @fileOverview Auth Service handles the logic for user login and retrieval.
 */

export const loginUser = async ({ email, password, isFirebaseSynced }: any) => {
  const normalizedEmail = email.toLowerCase().trim();

  // 1. Credentials Bypass (For Prototyping, Initial Access, and new Super Admins)
  // The frontend handles Firebase validation, we trust the incoming request from the login flow
  if (
    (normalizedEmail === 'admin@cafeqr.com' && password === '123456') ||
    (normalizedEmail === 'abdullah@urbanbrew.om' && password === 'Admin@123') ||
    normalizedEmail === 'admin@admin.com' ||
    normalizedEmail === 'abdullah.j@creativetechno.net'
  ) {
    const demoUser = {
      id: (normalizedEmail === 'admin@cafeqr.com' || normalizedEmail === 'admin@admin.com') ? '1' : '2',
      full_name: (normalizedEmail === 'admin@cafeqr.com' || normalizedEmail === 'admin@admin.com') ? 'Demo Admin' : 'Abdullah Al Jahwari',
      email: normalizedEmail,
      roles: ['SUPER_ADMIN']
    };

    const token = signToken({
      sub: demoUser.id,
      email: demoUser.email,
      roles: demoUser.roles
    });

    return { token, user: demoUser };
  }

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

    const token = signToken({
      sub: String(user.id),
      email: user.email,
      roles
    });

    return {
      token,
      user: {
        id: String(user.id),
        full_name: user.fullName,
        email: user.email,
        roles
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
  // Handle demo user ID
  if (userId === '1' || userId === '2') {
    return {
      id: userId,
      full_name: userId === '1' ? 'Demo Admin' : 'Abdullah Al Jahwari',
      email: userId === '1' ? 'admin@cafeqr.com' : 'abdullah@urbanbrew.om',
      roles: ['SUPER_ADMIN']
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

  return {
    id: String(user.id),
    full_name: user.fullName,
    email: user.email,
    roles: userRoles.map((item: any) => item.role.name)
  };
};

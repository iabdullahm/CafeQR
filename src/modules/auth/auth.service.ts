
import { signToken } from '../../utils/jwt';
import prisma from '../../config/prisma';
import bcrypt from 'bcryptjs';

/**
 * @fileOverview Auth Service handles the logic for user login and retrieval.
 */

export const loginUser = async ({ email, password }: any) => {
  const normalizedEmail = email.toLowerCase().trim();

  // 1. Demo Credentials Bypass (For Prototyping and Initial Access)
  if (normalizedEmail === 'admin@cafeqr.com' && password === '123456') {
    const demoUser = {
      id: '1',
      full_name: 'Demo Admin',
      email: 'admin@cafeqr.com',
      roles: ['super_admin']
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
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

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
  if (userId === '1') {
    return {
      id: '1',
      full_name: 'Demo Admin',
      email: 'admin@cafeqr.com',
      roles: ['super_admin']
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


import { comparePassword, signToken } from '../../utils/jwt';
import prisma from '../../config/prisma';
import bcrypt from 'bcryptjs';

export const loginUser = async ({ email, password }: any) => {
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Use bcryptjs compare
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }

  const userRoles = await prisma.userRole.findMany({
    where: { userId: user.id },
    include: {
      role: true
    }
  });

  const roles = userRoles.map((item: any) => item.role.name);

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
};

export const getCurrentUser = async (userId: string) => {
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

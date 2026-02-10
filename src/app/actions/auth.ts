'use server';

import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { getCurrentUser } from '@/lib/auth';

/**
 * Get the current authenticated user's full profile
 */
export async function getCurrentUserProfile() {
  try {
    const jwtPayload = await getCurrentUser();

    if (!jwtPayload) {
      return { success: false, error: 'Not authenticated' };
    }

    const user = await prisma.user.findUnique({
      where: { id: jwtPayload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    return { success: true, user };
  } catch (error) {
    console.error('[Get Current User Profile]', error);
    return { success: false, error: 'Failed to get user profile' };
  }
}


/**
 * Change user password
 */
export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}) {
  try {
    const jwtPayload = await getCurrentUser();

    if (!jwtPayload) {
      return { success: false, error: 'Not authenticated' };
    }

    const { currentPassword, newPassword } = data;

    if (!currentPassword || !newPassword) {
      return { success: false, error: 'Missing required fields' };
    }

    if (newPassword.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters' };
    }

    const user = await prisma.user.findUnique({
      where: { id: jwtPayload.userId },
    });

    if (!user || !user.password) {
      return { success: false, error: 'User not found or not a PostgreSQL auth user' };
    }

    // Verify current password
    const { verifyPassword: verifyPwd } = await import('@/lib/auth');
    const passwordMatch = await verifyPwd(currentPassword, user.password);

    if (!passwordMatch) {
      return { success: false, error: 'Current password is incorrect' };
    }

    // Update password
    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: jwtPayload.userId },
      data: {
        password: hashedPassword,
        lastPasswordChange: new Date(),
      },
    });

    return { success: true, message: 'Password changed successfully' };
  } catch (error) {
    console.error('[Change Password]', error);
    return { success: false, error: 'Failed to change password' };
  }
}

/**
 * Update user profile (name, email, etc.)
 */
export async function updateUserProfile(data: {
  name?: string;
  email?: string;
}) {
  try {
    const jwtPayload = await getCurrentUser();

    if (!jwtPayload) {
      return { success: false, error: 'Not authenticated' };
    }

    const updateData: any = {};

    if (data.name) {
      updateData.name = data.name;
    }

    if (data.email && data.email !== jwtPayload.email) {
      // Check if new email is already in use
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existingUser && existingUser.id !== jwtPayload.userId) {
        return { success: false, error: 'Email already in use' };
      }

      updateData.email = data.email;
    }

    if (Object.keys(updateData).length === 0) {
      return { success: true, message: 'No changes to update' };
    }

    const user = await prisma.user.update({
      where: { id: jwtPayload.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
      },
    });

    return { success: true, user };
  } catch (error) {
    console.error('[Update User Profile]', error);
    return { success: false, error: 'Failed to update profile' };
  }
}

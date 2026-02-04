'use server';

import { prisma } from '@/lib/db';

/**
 * Creates or updates a user in the PostgreSQL database.
 * This ensures that Firebase users and guest shoppers both appear in "Contacts".
 */
export async function syncUserToDb(data: {
  id?: string;
  email: string;
  name?: string;
}) {
  try {
    // If we have an ID (from Firebase), we use it. Otherwise, we match by email.
    const user = await prisma.user.upsert({
      where: { email: data.email },
      update: {
        ...(data.id ? { id: data.id } : {}),
        ...(data.name ? { name: data.name } : {}),
      },
      create: {
        id: data.id || undefined, // Prisma will generate a CUID if not provided
        email: data.email,
        name: data.name || 'Valued Collector',
      },
    });

    return { success: true, user };
  } catch (error) {
    console.error('[Sync User] Error:', error);
    return { success: false, error: 'Failed to sync user data' };
  }
}

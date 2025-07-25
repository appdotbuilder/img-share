
import { db } from '../db';
import { imagesTable } from '../db/schema';
import { type Image } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getPublicImages(): Promise<Image[]> {
  try {
    const results = await db.select()
      .from(imagesTable)
      .where(eq(imagesTable.is_public, true))
      .orderBy(desc(imagesTable.created_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch public images:', error);
    throw error;
  }
}

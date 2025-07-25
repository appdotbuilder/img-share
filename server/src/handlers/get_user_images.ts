
import { db } from '../db';
import { imagesTable } from '../db/schema';
import { type GetUserImagesInput, type Image } from '../schema';
import { eq } from 'drizzle-orm';

export const getUserImages = async (input: GetUserImagesInput): Promise<Image[]> => {
  try {
    // Query all images for the specified user
    const results = await db.select()
      .from(imagesTable)
      .where(eq(imagesTable.user_id, input.user_id))
      .execute();

    // Return the results as-is since all fields are already the correct types
    return results;
  } catch (error) {
    console.error('Get user images failed:', error);
    throw error;
  }
};

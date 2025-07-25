
import { db } from '../db';
import { imagesTable } from '../db/schema';
import { type DeleteImageInput } from '../schema';
import { eq, and } from 'drizzle-orm';

export const deleteImage = async (input: DeleteImageInput): Promise<boolean> => {
  try {
    // Delete the image record, verifying ownership
    const result = await db.delete(imagesTable)
      .where(
        and(
          eq(imagesTable.id, input.id),
          eq(imagesTable.user_id, input.user_id)
        )
      )
      .execute();

    // Return true if a record was deleted, false otherwise
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Image deletion failed:', error);
    throw error;
  }
};

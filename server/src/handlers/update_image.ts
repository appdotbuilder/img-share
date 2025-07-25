
import { db } from '../db';
import { imagesTable } from '../db/schema';
import { type UpdateImageInput, type Image } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateImage(input: UpdateImageInput): Promise<Image | null> {
  try {
    // Check if image exists
    const existingImages = await db.select()
      .from(imagesTable)
      .where(eq(imagesTable.id, input.id))
      .execute();

    if (existingImages.length === 0) {
      return null;
    }

    // Build update object with only provided fields
    const updateData: Partial<typeof imagesTable.$inferInsert> = {
      updated_at: new Date()
    };

    if (input.title !== undefined) {
      updateData.title = input.title;
    }

    if (input.description !== undefined) {
      updateData.description = input.description;
    }

    if (input.is_public !== undefined) {
      updateData.is_public = input.is_public;
    }

    // Update image record
    const result = await db.update(imagesTable)
      .set(updateData)
      .where(eq(imagesTable.id, input.id))
      .returning()
      .execute();

    return result[0] || null;
  } catch (error) {
    console.error('Image update failed:', error);
    throw error;
  }
}

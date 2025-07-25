
import { db } from '../db';
import { imagesTable } from '../db/schema';
import { type GetImageByShortUrlInput, type Image } from '../schema';
import { eq } from 'drizzle-orm';

export async function getImageByShortUrl(input: GetImageByShortUrlInput): Promise<Image | null> {
  try {
    // First, find the image by short URL
    const results = await db.select()
      .from(imagesTable)
      .where(eq(imagesTable.short_url, input.short_url))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const image = results[0];

    // Check if image is public (private images not supported in this handler)
    if (!image.is_public) {
      return null;
    }

    // Increment view count
    await db.update(imagesTable)
      .set({ 
        view_count: image.view_count + 1,
        updated_at: new Date()
      })
      .where(eq(imagesTable.id, image.id))
      .execute();

    // Return the image with incremented view count
    return {
      ...image,
      view_count: image.view_count + 1
    };
  } catch (error) {
    console.error('Failed to get image by short URL:', error);
    throw error;
  }
}

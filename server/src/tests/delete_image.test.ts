
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, imagesTable } from '../db/schema';
import { type DeleteImageInput } from '../schema';
import { deleteImage } from '../handlers/delete_image';
import { eq } from 'drizzle-orm';

describe('deleteImage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testImageId: number;
  let otherUserId: number;

  beforeEach(async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([
        {
          username: 'testuser',
          email: 'test@example.com'
        },
        {
          username: 'otheruser',
          email: 'other@example.com'
        }
      ])
      .returning()
      .execute();

    testUserId = users[0].id;
    otherUserId = users[1].id;

    // Create test image
    const images = await db.insert(imagesTable)
      .values({
        user_id: testUserId,
        title: 'Test Image',
        description: 'A test image',
        filename: 'test.jpg',
        file_path: '/path/to/test.jpg',
        file_size: 12345,
        mime_type: 'image/jpeg',
        short_url: 'abc123',
        is_public: true
      })
      .returning()
      .execute();

    testImageId = images[0].id;
  });

  it('should delete image when user owns it', async () => {
    const input: DeleteImageInput = {
      id: testImageId,
      user_id: testUserId
    };

    const result = await deleteImage(input);

    expect(result).toBe(true);

    // Verify image was deleted from database
    const images = await db.select()
      .from(imagesTable)
      .where(eq(imagesTable.id, testImageId))
      .execute();

    expect(images).toHaveLength(0);
  });

  it('should not delete image when user does not own it', async () => {
    const input: DeleteImageInput = {
      id: testImageId,
      user_id: otherUserId // Different user
    };

    const result = await deleteImage(input);

    expect(result).toBe(false);

    // Verify image still exists in database
    const images = await db.select()
      .from(imagesTable)
      .where(eq(imagesTable.id, testImageId))
      .execute();

    expect(images).toHaveLength(1);
    expect(images[0].id).toBe(testImageId);
  });

  it('should return false when image does not exist', async () => {
    const input: DeleteImageInput = {
      id: 99999, // Non-existent image ID
      user_id: testUserId
    };

    const result = await deleteImage(input);

    expect(result).toBe(false);
  });

  it('should return false when both image and user do not match', async () => {
    const input: DeleteImageInput = {
      id: 99999, // Non-existent image ID
      user_id: 99999 // Non-existent user ID
    };

    const result = await deleteImage(input);

    expect(result).toBe(false);
  });
});

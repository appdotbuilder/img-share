
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, imagesTable } from '../db/schema';
import { type UpdateImageInput } from '../schema';
import { updateImage } from '../handlers/update_image';
import { eq } from 'drizzle-orm';

// Test user data
const testUser = {
  username: 'testuser',
  email: 'test@example.com'
};

// Test image data
const testImage = {
  title: 'Original Title',
  description: 'Original description',
  filename: 'test.jpg',
  file_path: '/uploads/test.jpg',
  file_size: 1024,
  mime_type: 'image/jpeg',
  short_url: 'abc123',
  is_public: true
};

describe('updateImage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update image title', async () => {
    // Create user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create image
    const imageResult = await db.insert(imagesTable)
      .values({
        ...testImage,
        user_id: userId
      })
      .returning()
      .execute();
    const imageId = imageResult[0].id;

    const updateInput: UpdateImageInput = {
      id: imageId,
      title: 'Updated Title'
    };

    const result = await updateImage(updateInput);

    expect(result).not.toBe(null);
    expect(result!.id).toEqual(imageId);
    expect(result!.title).toEqual('Updated Title');
    expect(result!.description).toEqual('Original description'); // Unchanged
    expect(result!.is_public).toEqual(true); // Unchanged
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should update image description', async () => {
    // Create user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create image
    const imageResult = await db.insert(imagesTable)
      .values({
        ...testImage,
        user_id: userId
      })
      .returning()
      .execute();
    const imageId = imageResult[0].id;

    const updateInput: UpdateImageInput = {
      id: imageId,
      description: 'Updated description'
    };

    const result = await updateImage(updateInput);

    expect(result).not.toBe(null);
    expect(result!.id).toEqual(imageId);
    expect(result!.title).toEqual('Original Title'); // Unchanged
    expect(result!.description).toEqual('Updated description');
    expect(result!.is_public).toEqual(true); // Unchanged
  });

  it('should update image visibility', async () => {
    // Create user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create image
    const imageResult = await db.insert(imagesTable)
      .values({
        ...testImage,
        user_id: userId
      })
      .returning()
      .execute();
    const imageId = imageResult[0].id;

    const updateInput: UpdateImageInput = {
      id: imageId,
      is_public: false
    };

    const result = await updateImage(updateInput);

    expect(result).not.toBe(null);
    expect(result!.id).toEqual(imageId);
    expect(result!.title).toEqual('Original Title'); // Unchanged
    expect(result!.description).toEqual('Original description'); // Unchanged
    expect(result!.is_public).toEqual(false);
  });

  it('should update multiple fields at once', async () => {
    // Create user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create image
    const imageResult = await db.insert(imagesTable)
      .values({
        ...testImage,
        user_id: userId
      })
      .returning()
      .execute();
    const imageId = imageResult[0].id;

    const updateInput: UpdateImageInput = {
      id: imageId,
      title: 'New Title',
      description: 'New description',
      is_public: false
    };

    const result = await updateImage(updateInput);

    expect(result).not.toBe(null);
    expect(result!.id).toEqual(imageId);
    expect(result!.title).toEqual('New Title');
    expect(result!.description).toEqual('New description');
    expect(result!.is_public).toEqual(false);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should set description to null', async () => {
    // Create user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create image
    const imageResult = await db.insert(imagesTable)
      .values({
        ...testImage,
        user_id: userId
      })
      .returning()
      .execute();
    const imageId = imageResult[0].id;

    const updateInput: UpdateImageInput = {
      id: imageId,
      description: null
    };

    const result = await updateImage(updateInput);

    expect(result).not.toBe(null);
    expect(result!.id).toEqual(imageId);
    expect(result!.description).toBeNull();
  });

  it('should save updates to database', async () => {
    // Create user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create image
    const imageResult = await db.insert(imagesTable)
      .values({
        ...testImage,
        user_id: userId
      })
      .returning()
      .execute();
    const imageId = imageResult[0].id;
    const originalUpdatedAt = imageResult[0].updated_at;

    const updateInput: UpdateImageInput = {
      id: imageId,
      title: 'Database Test Title'
    };

    await updateImage(updateInput);

    // Verify changes were saved to database
    const images = await db.select()
      .from(imagesTable)
      .where(eq(imagesTable.id, imageId))
      .execute();

    expect(images).toHaveLength(1);
    expect(images[0].title).toEqual('Database Test Title');
    expect(images[0].updated_at).toBeInstanceOf(Date);
    expect(images[0].updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should return null for non-existent image', async () => {
    const updateInput: UpdateImageInput = {
      id: 99999,
      title: 'New Title'
    };

    const result = await updateImage(updateInput);

    expect(result).toBeNull();
  });
});

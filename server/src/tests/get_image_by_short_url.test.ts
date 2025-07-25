
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, imagesTable } from '../db/schema';
import { type GetImageByShortUrlInput, type CreateUserInput, type UploadImageInput } from '../schema';
import { getImageByShortUrl } from '../handlers/get_image_by_short_url';
import { eq } from 'drizzle-orm';

const testUserInput: CreateUserInput = {
  username: 'testuser',
  email: 'test@example.com'
};

const testImageInput: UploadImageInput = {
  user_id: 1, // Will be set after user creation
  title: 'Test Image',
  description: 'A test image',
  filename: 'test.jpg',
  file_path: '/uploads/test.jpg',
  file_size: 1024,
  mime_type: 'image/jpeg',
  is_public: true
};

describe('getImageByShortUrl', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return image by short URL and increment view count', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testUserInput)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test image
    const imageResult = await db.insert(imagesTable)
      .values({
        ...testImageInput,
        user_id: userId,
        short_url: 'abc123',
        view_count: 5
      })
      .returning()
      .execute();
    const createdImage = imageResult[0];

    const input: GetImageByShortUrlInput = {
      short_url: 'abc123'
    };

    const result = await getImageByShortUrl(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdImage.id);
    expect(result!.title).toEqual('Test Image');
    expect(result!.description).toEqual('A test image');
    expect(result!.filename).toEqual('test.jpg');
    expect(result!.file_path).toEqual('/uploads/test.jpg');
    expect(result!.file_size).toEqual(1024);
    expect(result!.mime_type).toEqual('image/jpeg');
    expect(result!.short_url).toEqual('abc123');
    expect(result!.view_count).toEqual(6); // Incremented from 5 to 6
    expect(result!.is_public).toEqual(true);
    expect(result!.user_id).toEqual(userId);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should update view count in database', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testUserInput)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test image
    const imageResult = await db.insert(imagesTable)
      .values({
        ...testImageInput,
        user_id: userId,
        short_url: 'xyz789',
        view_count: 0
      })
      .returning()
      .execute();
    const imageId = imageResult[0].id;

    const input: GetImageByShortUrlInput = {
      short_url: 'xyz789'
    };

    await getImageByShortUrl(input);

    // Verify view count was updated in database
    const updatedImages = await db.select()
      .from(imagesTable)
      .where(eq(imagesTable.id, imageId))
      .execute();

    expect(updatedImages).toHaveLength(1);
    expect(updatedImages[0].view_count).toEqual(1);
  });

  it('should return null for non-existent short URL', async () => {
    const input: GetImageByShortUrlInput = {
      short_url: 'nonexistent'
    };

    const result = await getImageByShortUrl(input);

    expect(result).toBeNull();
  });

  it('should return null for private images', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testUserInput)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create private test image
    await db.insert(imagesTable)
      .values({
        ...testImageInput,
        user_id: userId,
        short_url: 'private123',
        is_public: false
      })
      .returning()
      .execute();

    const input: GetImageByShortUrlInput = {
      short_url: 'private123'
    };

    const result = await getImageByShortUrl(input);

    expect(result).toBeNull();
  });

  it('should handle null description correctly', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testUserInput)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test image with null description
    await db.insert(imagesTable)
      .values({
        ...testImageInput,
        user_id: userId,
        short_url: 'nulldesc',
        description: null
      })
      .returning()
      .execute();

    const input: GetImageByShortUrlInput = {
      short_url: 'nulldesc'
    };

    const result = await getImageByShortUrl(input);

    expect(result).not.toBeNull();
    expect(result!.description).toBeNull();
    expect(result!.view_count).toEqual(1); // Should still increment view count
  });
});

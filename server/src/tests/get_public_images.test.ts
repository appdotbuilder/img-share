
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, imagesTable } from '../db/schema';
import { getPublicImages } from '../handlers/get_public_images';

describe('getPublicImages', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no images exist', async () => {
    const result = await getPublicImages();
    expect(result).toEqual([]);
  });

  it('should return only public images', async () => {
    // Create a test user first
    const [user] = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    // Create public and private images
    await db.insert(imagesTable)
      .values([
        {
          user_id: user.id,
          title: 'Public Image',
          filename: 'public.jpg',
          file_path: '/uploads/public.jpg',
          file_size: 1024,
          mime_type: 'image/jpeg',
          short_url: 'pub123',
          is_public: true
        },
        {
          user_id: user.id,
          title: 'Private Image',
          filename: 'private.jpg',
          file_path: '/uploads/private.jpg',
          file_size: 2048,
          mime_type: 'image/jpeg',
          short_url: 'prv456',
          is_public: false
        }
      ])
      .execute();

    const result = await getPublicImages();

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Public Image');
    expect(result[0].is_public).toBe(true);
  });

  it('should return images ordered by creation date (newest first)', async () => {
    // Create a test user first
    const [user] = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    // Create images with different timestamps
    const older = new Date('2023-01-01T10:00:00Z');
    const newer = new Date('2023-01-02T10:00:00Z');

    await db.insert(imagesTable)
      .values([
        {
          user_id: user.id,
          title: 'Older Image',
          filename: 'older.jpg',
          file_path: '/uploads/older.jpg',
          file_size: 1024,
          mime_type: 'image/jpeg',
          short_url: 'old123',
          is_public: true,
          created_at: older
        },
        {
          user_id: user.id,
          title: 'Newer Image',
          filename: 'newer.jpg',
          file_path: '/uploads/newer.jpg',
          file_size: 2048,
          mime_type: 'image/jpeg',
          short_url: 'new456',
          is_public: true,
          created_at: newer
        }
      ])
      .execute();

    const result = await getPublicImages();

    expect(result).toHaveLength(2);
    expect(result[0].title).toEqual('Newer Image');
    expect(result[1].title).toEqual('Older Image');
    expect(result[0].created_at.getTime()).toBeGreaterThan(result[1].created_at.getTime());
  });

  it('should include all required image fields', async () => {
    // Create a test user first
    const [user] = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    // Create a test image
    await db.insert(imagesTable)
      .values({
        user_id: user.id,
        title: 'Test Image',
        description: 'A test description',
        filename: 'test.jpg',
        file_path: '/uploads/test.jpg',
        file_size: 1024,
        mime_type: 'image/jpeg',
        short_url: 'tst123',
        view_count: 5,
        is_public: true
      })
      .execute();

    const result = await getPublicImages();

    expect(result).toHaveLength(1);
    const image = result[0];

    expect(image.id).toBeDefined();
    expect(image.user_id).toEqual(user.id);
    expect(image.title).toEqual('Test Image');
    expect(image.description).toEqual('A test description');
    expect(image.filename).toEqual('test.jpg');
    expect(image.file_path).toEqual('/uploads/test.jpg');
    expect(image.file_size).toEqual(1024);
    expect(image.mime_type).toEqual('image/jpeg');
    expect(image.short_url).toEqual('tst123');
    expect(image.view_count).toEqual(5);
    expect(image.is_public).toBe(true);
    expect(image.created_at).toBeInstanceOf(Date);
    expect(image.updated_at).toBeInstanceOf(Date);
  });
});

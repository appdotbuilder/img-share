
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, imagesTable } from '../db/schema';
import { type GetUserImagesInput, type CreateUserInput, type UploadImageInput } from '../schema';
import { getUserImages } from '../handlers/get_user_images';
import { eq } from 'drizzle-orm';

// Create test user input
const testUserInput: CreateUserInput = {
  username: 'testuser',
  email: 'test@example.com'
};

// Create test image inputs
const testImageInput1: UploadImageInput = {
  user_id: 1, // Will be updated after user creation
  title: 'Test Image 1',
  description: 'First test image',
  filename: 'test1.jpg',
  file_path: '/uploads/test1.jpg',
  file_size: 1024,
  mime_type: 'image/jpeg',
  is_public: true
};

const testImageInput2: UploadImageInput = {
  user_id: 1, // Will be updated after user creation
  title: 'Test Image 2',
  description: null,
  filename: 'test2.png',
  file_path: '/uploads/test2.png',
  file_size: 2048,
  mime_type: 'image/png',
  is_public: false
};

describe('getUserImages', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all images for a user', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: testUserInput.username,
        email: testUserInput.email,
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create test images for the user
    await db.insert(imagesTable)
      .values([
        {
          ...testImageInput1,
          user_id: userId,
          short_url: 'abc123'
        },
        {
          ...testImageInput2,
          user_id: userId,
          short_url: 'def456'
        }
      ])
      .execute();

    const input: GetUserImagesInput = {
      user_id: userId
    };

    const result = await getUserImages(input);

    // Should return both images
    expect(result).toHaveLength(2);

    // Verify both images are returned
    const titles = result.map(img => img.title);
    expect(titles).toContain('Test Image 1');
    expect(titles).toContain('Test Image 2');

    // Verify all fields are present and correct types
    result.forEach(image => {
      expect(image.id).toBeDefined();
      expect(image.user_id).toEqual(userId);
      expect(typeof image.title).toBe('string');
      expect(typeof image.filename).toBe('string');
      expect(typeof image.file_path).toBe('string');
      expect(typeof image.file_size).toBe('number');
      expect(typeof image.mime_type).toBe('string');
      expect(typeof image.short_url).toBe('string');
      expect(typeof image.view_count).toBe('number');
      expect(typeof image.is_public).toBe('boolean');
      expect(image.created_at).toBeInstanceOf(Date);
      expect(image.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should return empty array when user has no images', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: testUserInput.username,
        email: testUserInput.email,
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    const input: GetUserImagesInput = {
      user_id: userId
    };

    const result = await getUserImages(input);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return only images belonging to specified user', async () => {
    // Create two test users
    const user1Result = await db.insert(usersTable)
      .values({
        username: 'user1',
        email: 'user1@example.com',
      })
      .returning()
      .execute();

    const user2Result = await db.insert(usersTable)
      .values({
        username: 'user2', 
        email: 'user2@example.com',
      })
      .returning()
      .execute();
    
    const user1Id = user1Result[0].id;
    const user2Id = user2Result[0].id;

    // Create images for both users
    await db.insert(imagesTable)
      .values([
        {
          ...testImageInput1,
          user_id: user1Id,
          title: 'User 1 Image',
          short_url: 'user1img'
        },
        {
          ...testImageInput2,
          user_id: user2Id,
          title: 'User 2 Image',
          short_url: 'user2img'
        }
      ])
      .execute();

    const input: GetUserImagesInput = {
      user_id: user1Id
    };

    const result = await getUserImages(input);

    // Should return only user 1's image
    expect(result).toHaveLength(1);
    expect(result[0].user_id).toEqual(user1Id);
    expect(result[0].title).toEqual('User 1 Image');
  });

  it('should return both public and private images for the user', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: testUserInput.username,
        email: testUserInput.email,
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create one public and one private image
    await db.insert(imagesTable)
      .values([
        {
          ...testImageInput1,
          user_id: userId,
          is_public: true,
          short_url: 'public1'
        },
        {
          ...testImageInput2,
          user_id: userId,
          is_public: false,
          short_url: 'private1'
        }
      ])
      .execute();

    const input: GetUserImagesInput = {
      user_id: userId
    };

    const result = await getUserImages(input);

    // Should return both public and private images
    expect(result).toHaveLength(2);
    
    const publicImages = result.filter(img => img.is_public);
    const privateImages = result.filter(img => !img.is_public);
    
    expect(publicImages).toHaveLength(1);
    expect(privateImages).toHaveLength(1);
  });
});

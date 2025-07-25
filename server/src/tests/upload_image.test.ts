
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, imagesTable } from '../db/schema';
import { type UploadImageInput } from '../schema';
import { uploadImage } from '../handlers/upload_image';
import { eq } from 'drizzle-orm';

let testUserId: number;

const testInput: UploadImageInput = {
    user_id: 0, // Will be set after user creation
    title: 'Test Image',
    description: 'A test image description',
    filename: 'test-image.jpg',
    file_path: '/uploads/test-image.jpg',
    file_size: 1024000,
    mime_type: 'image/jpeg',
    is_public: true
};

describe('uploadImage', () => {
    beforeEach(async () => {
        await createDB();
        
        // Create test user
        const user = await db.insert(usersTable)
            .values({
                username: 'testuser',
                email: 'test@example.com'
            })
            .returning()
            .execute();
        
        testUserId = user[0].id;
        testInput.user_id = testUserId;
    });

    afterEach(resetDB);

    it('should upload an image successfully', async () => {
        const result = await uploadImage(testInput);

        expect(result.id).toBeDefined();
        expect(result.user_id).toEqual(testUserId);
        expect(result.title).toEqual('Test Image');
        expect(result.description).toEqual('A test image description');
        expect(result.filename).toEqual('test-image.jpg');
        expect(result.file_path).toEqual('/uploads/test-image.jpg');
        expect(result.file_size).toEqual(1024000);
        expect(result.mime_type).toEqual('image/jpeg');
        expect(result.short_url).toBeDefined();
        expect(result.short_url.length).toEqual(8);
        expect(result.view_count).toEqual(0);
        expect(result.is_public).toEqual(true);
        expect(result.created_at).toBeInstanceOf(Date);
        expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should save image to database', async () => {
        const result = await uploadImage(testInput);

        const images = await db.select()
            .from(imagesTable)
            .where(eq(imagesTable.id, result.id))
            .execute();

        expect(images).toHaveLength(1);
        expect(images[0].title).toEqual('Test Image');
        expect(images[0].user_id).toEqual(testUserId);
        expect(images[0].short_url).toEqual(result.short_url);
    });

    it('should generate unique short URL', async () => {
        const result1 = await uploadImage(testInput);
        const result2 = await uploadImage({
            ...testInput,
            title: 'Second Image'
        });

        expect(result1.short_url).not.toEqual(result2.short_url);
        expect(result1.short_url.length).toEqual(8);
        expect(result2.short_url.length).toEqual(8);
    });

    it('should handle null description', async () => {
        const inputWithNullDescription = {
            ...testInput,
            description: null
        };

        const result = await uploadImage(inputWithNullDescription);

        expect(result.description).toBeNull();
    });

    it('should handle undefined description', async () => {
        const inputWithUndefinedDescription = {
            ...testInput,
            description: undefined
        };

        const result = await uploadImage(inputWithUndefinedDescription);

        expect(result.description).toBeNull();
    });

    it('should set default values correctly', async () => {
        const result = await uploadImage(testInput);

        expect(result.view_count).toEqual(0);
        expect(result.is_public).toEqual(true);
    });

    it('should handle is_public false', async () => {
        const privateImageInput = {
            ...testInput,
            is_public: false
        };

        const result = await uploadImage(privateImageInput);

        expect(result.is_public).toEqual(false);
    });

    it('should throw error for non-existent user', async () => {
        const invalidInput = {
            ...testInput,
            user_id: 99999
        };

        expect(uploadImage(invalidInput)).rejects.toThrow(/user not found/i);
    });
});

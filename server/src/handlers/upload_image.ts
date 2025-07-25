
import { db } from '../db';
import { imagesTable, usersTable } from '../db/schema';
import { type UploadImageInput, type Image } from '../schema';
import { eq } from 'drizzle-orm';

// Helper function to generate short URL
function generateShortUrl(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Helper function to ensure unique short URL
async function generateUniqueShortUrl(): Promise<string> {
    let shortUrl = generateShortUrl();
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
        const existing = await db.select()
            .from(imagesTable)
            .where(eq(imagesTable.short_url, shortUrl))
            .execute();

        if (existing.length === 0) {
            return shortUrl;
        }

        shortUrl = generateShortUrl();
        attempts++;
    }

    throw new Error('Unable to generate unique short URL after multiple attempts');
}

export async function uploadImage(input: UploadImageInput): Promise<Image> {
    try {
        // Verify user exists
        const user = await db.select()
            .from(usersTable)
            .where(eq(usersTable.id, input.user_id))
            .execute();

        if (user.length === 0) {
            throw new Error('User not found');
        }

        // Generate unique short URL
        const shortUrl = await generateUniqueShortUrl();

        // Insert image record
        const result = await db.insert(imagesTable)
            .values({
                user_id: input.user_id,
                title: input.title,
                description: input.description,
                filename: input.filename,
                file_path: input.file_path,
                file_size: input.file_size,
                mime_type: input.mime_type,
                short_url: shortUrl,
                is_public: input.is_public
            })
            .returning()
            .execute();

        return result[0];
    } catch (error) {
        console.error('Image upload failed:', error);
        throw error;
    }
}

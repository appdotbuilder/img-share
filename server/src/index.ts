
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  createUserInputSchema, 
  uploadImageInputSchema, 
  updateImageInputSchema,
  getImageByShortUrlInputSchema,
  getUserImagesInputSchema,
  deleteImageInputSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { uploadImage } from './handlers/upload_image';
import { getImageByShortUrl } from './handlers/get_image_by_short_url';
import { getPublicImages } from './handlers/get_public_images';
import { getUserImages } from './handlers/get_user_images';
import { updateImage } from './handlers/update_image';
import { deleteImage } from './handlers/delete_image';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // User operations
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),
  
  // Image operations
  uploadImage: publicProcedure
    .input(uploadImageInputSchema)
    .mutation(({ input }) => uploadImage(input)),
  
  getImageByShortUrl: publicProcedure
    .input(getImageByShortUrlInputSchema)
    .query(({ input }) => getImageByShortUrl(input)),
  
  getPublicImages: publicProcedure
    .query(() => getPublicImages()),
  
  getUserImages: publicProcedure
    .input(getUserImagesInputSchema)
    .query(({ input }) => getUserImages(input)),
  
  updateImage: publicProcedure
    .input(updateImageInputSchema)
    .mutation(({ input }) => updateImage(input)),
  
  deleteImage: publicProcedure
    .input(deleteImageInputSchema)
    .mutation(({ input }) => deleteImage(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();

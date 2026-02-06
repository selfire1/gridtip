// app/api/uploadthing/route.ts
import { uploadthingFileRouter } from '@/lib/uploadthing'
import { createRouteHandler } from 'uploadthing/next'

export const { GET, POST } = createRouteHandler({
  router: uploadthingFileRouter,
  // Optional: Add config
  config: {
    // Your UploadThing app ID (optional, can use env vars instead)
    // uploadthingId: process.env.UPLOADTHING_APP_ID,
  },
})

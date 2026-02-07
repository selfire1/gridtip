import defu from 'defu'
import imageCompression from 'browser-image-compression'
import type { Options } from 'browser-image-compression'

export async function getCompressedFile(
  imageFile: File,
  options?: Partial<Options>,
) {
  const defaults = {
    maxSizeMB: 0.6,
    maxWidthOrHeight: 800,
    useWebWorker: true,
  } satisfies Options

  const resolvedOptions = defu(options, defaults)
  const blob = await imageCompression(imageFile, resolvedOptions)
  const compressedFile = new File([blob], imageFile.name, {
    type: imageFile.type,
  })

  return compressedFile
}

import type { Options } from 'browser-image-compression'
import imageCompression from 'browser-image-compression'
import defu from 'defu'

export async function getCompressedFile(
  imageFile: File,
  options?: Partial<Options>,
) {
  const defaults = {
    maxSizeMB: 1.5,
    maxWidthOrHeight: 1000,
    useWebWorker: true,
  } satisfies Options

  const resolvedOptions = defu(options, defaults)
  const blob = await imageCompression(imageFile, resolvedOptions)
  const compressedFile = new File([blob], imageFile.name, {
    type: imageFile.type,
  })

  return compressedFile
}

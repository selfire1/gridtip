import { db } from '@/db'
import path from 'path'

async function main() {
  const rootPath = path.join(import.meta.dir, '..')
  const userImgsPath = path.join(rootPath, 'public', 'img', 'user')

  const users = await db.query.user.findMany({
    columns: {
      image: true,
      id: true,
    },
  })

  console.log('Got', users.length, 'users')

  let savedCount = 0

  console.time('Saving images')
  await Promise.all(
    users.map(async (user) => {
      if (!user.image) {
        console.log(`Skipping user ${user.id}: No image found`)
        return
      }

      const filePath = path.join(userImgsPath, `${user.id}.png`)
      try {
        const response = await fetch(user.image)
        if (!response.ok)
          throw new Error(`Failed to fetch: ${response.statusText}`)

        const arrayBuffer = await response.arrayBuffer()
        const data = new Uint8Array(arrayBuffer)
        await Bun.write(filePath, data)
        console.log('Saved image -', data.length, 'bytes')
        savedCount++
      } catch (error) {
        console.error(`Error downloading image for user ${user.id}:`, error)
      }
    }),
  )

  console.timeEnd('Saving images')
  console.log(`Total images saved`, savedCount)
}

main()

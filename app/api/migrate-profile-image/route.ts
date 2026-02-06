import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { UTApi } from 'uploadthing/server'
import z from 'zod'
import { db } from '@/db'
import { user } from '@/db/schema/auth-schema'
import { eq } from 'drizzle-orm/sql'

export async function POST(req: NextRequest) {
  try {
    const json = await req.json()
    const result = await validateRequest(json)

    if (!result.ok) {
      console.error('Request not okay', {
        json,
        result,
      })
      return NextResponse.json(
        {
          success: false,
          error: result.message,
        },
        { status: 401 },
      )
    }

    const { googleImageUrl, userId } = result.data!

    const file = await getImageFile(
      googleImageUrl,
      `${userId}-google-profile.jpg`,
    )

    const uploadedResult = await uploadImage(file)
    if (uploadedResult.error) {
      return NextResponse.json(
        {
          success: false,
          error: uploadedResult.error,
        },
        { status: 500 },
      )
    }
    await db
      .update(user)
      .set({ profileImageUrl: uploadedResult.data.ufsUrl })
      .where(eq(user.id, userId))

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('Image migration failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

async function validateRequest(json: Record<string, unknown>) {
  const schema = z.object({
    userId: z.string(),
    googleImageUrl: z.string(),
    secret: z.string(),
  })

  const validation = schema.safeParse(json)
  if (!validation.success) {
    return {
      ok: false,
      data: undefined,
      message: validation.error.message,
    }
  }

  const providedPassword = validation.data.secret
  const storedHashedPassword = process.env.UPDATES_PASSWORD_HASH as string
  const isPasswordValid = await bcrypt.compare(
    providedPassword,
    storedHashedPassword,
  )

  if (!isPasswordValid) {
    return {
      ok: false,
      data: undefined,
      message: 'Invalid credentials',
    }
  }

  return {
    ok: true,
    data: validation.data,
    message: '',
  }
}

async function getImageFile(url: string, name: string) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to fetch Google image')
  }

  const blob = await response.blob()
  const isBiggerThan2MB = blob.size > 2 * 1024 * 1024
  if (isBiggerThan2MB) {
    throw new Error('Image is bigger than 2MB')
  }
  const file = new File([blob], name, {
    type: blob.type || 'image/jpeg',
  })
  return file
}

async function uploadImage(blob: File) {
  const utapi = new UTApi({
    token: process.env.UPLOADTHING_TOKEN,
  })
  return await utapi.uploadFiles(blob)
}

import 'server-only'

import { ofetch } from 'ofetch'
import { headers as getHeaders } from 'next/headers'
import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'

/**
 * @link https://github.com/jolpica/jolpica-f1/blob/main/docs/README.md
 */
export const fetchJolpica = ofetch.create({
  baseURL: 'https://api.jolpi.ca',
})

export async function validateToken() {
  const headers = await getHeaders()

  const authHeader = headers.get('authorization')

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    const response = createResponse(401, 'Invalid header')
    response.headers.set('WWW-Authenticate', 'Basic realm="Protected Area"')
    return response
  }

  const credentials = Buffer.from(authHeader.split(' ')[1], 'base64').toString()
  const [providedUsername, providedPassword] = credentials.split(':')

  const storedHashedPassword = process.env.UPDATES_PASSWORD_HASH as string
  const storedUser = process.env.UPDATES_USER as string

  const isPasswordValid = await bcrypt.compare(
    providedPassword,
    storedHashedPassword,
  )
  const isUserValid = providedUsername === storedUser
  if (!isPasswordValid || !isUserValid) {
    console.log('Provided: ', providedUsername, providedPassword)
    console.log('validity', { isPasswordValid, isUserValid })
    console.log({ storedHashedPassword, storedUser })
    console.log('env', process.env)
    return createResponse(401, 'Invalid credentials')
  }
  return {
    ok: true,
  } as const
}

export function createResponse(
  status: number,
  jsonOrMessage: Record<string, any> | string,
) {
  if (status.toString().startsWith('4') || status.toString().startsWith('5')) {
    return NextResponse.json(
      {
        error: jsonOrMessage,
      },
      { status },
    )
  }
  const body =
    typeof jsonOrMessage === 'string'
      ? { message: jsonOrMessage }
      : jsonOrMessage
  return NextResponse.json(body, { status })
}

export function areFieldsTheSame<
  TField extends string,
  TNewItem extends Partial<Record<TField, any> & Record<string, any>>,
  TStoredItem extends Record<TField, any> & Record<string, any>,
>(
  fields: TField[],

  compare: {
    newItem: TNewItem
    storedItem: TStoredItem
  },
) {
  const { newItem, storedItem } = compare
  for (const field of fields) {
    if (!(field in storedItem)) {
      console.log('difference: true', 'no field', field)
      return false
    }
    if (
      newItem[field]?.toString() !==
      storedItem[field as keyof TStoredItem]?.toString()
    ) {
      return false
    }
  }
  return true
}

export function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

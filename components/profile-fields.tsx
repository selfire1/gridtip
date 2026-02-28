'use client'

import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from '@ui/field'
import { Input } from '@ui/input'
import { LucideImageOff, LucideX } from 'lucide-react'
import React from 'react'
import { UsernameSchema } from '@/lib/schemas/username'
import { cn } from '@/lib/utils'
import { getCompressedFile } from '@/lib/utils/compress-image'
import { getFileDataURL } from '@/lib/utils/file-data-url'
import { ALLOWED_TYPES } from '@/lib/utils/file-limits'
import { Avatar, AvatarImage } from './ui/avatar'
import { Button } from './ui/button'
import { Spinner } from './ui/spinner'

export default function ProfileFields({
  id,
  name,
  image,
  onImageChange,
  onNameChange,
}: {
  id: string
  image: string | undefined
  name: string
  onNameChange: (name: string) => void
  onImageChange: (preview: string | undefined, file?: File) => void
}) {
  const [isProcessingImage, startTransition] = React.useTransition()

  const [nameValidationError, setNameValidationError] = React.useState<
    string | undefined
  >(undefined)

  function validateName(name: string) {
    setNameValidationError(undefined)
    const validation = UsernameSchema.safeParse(name)
    if (!validation.success) {
      setNameValidationError(validation.error.issues[0].message)
      return
    }
  }

  return (
    <>
      <Field>
        <FieldLabel htmlFor={`name-${id}`}>Name</FieldLabel>
        <Input
          autoComplete='off'
          className='bg-background'
          onBlur={(e) => validateName(e.target.value)}
          id={`name-${id}`}
          name='name'
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          aria-invalid={!!nameValidationError}
        />
        {!!nameValidationError && (
          <FieldError>{nameValidationError}</FieldError>
        )}
      </Field>
      <FieldSet>
        <FieldLabel htmlFor={`image-${id}`}>Image</FieldLabel>
        <FieldGroup className='flex sm:flex-row'>
          <Field className='sm:w-auto'>
            <span className='sr-only'>Image Preview</span>
            <div className='relative isolate !size-14'>
              <Avatar className={cn('size-14 border border-muted bg-muted')}>
                <AvatarImage
                  className={cn(
                    isProcessingImage && 'opacity-0',
                    'transition-opacity',
                  )}
                  src={image}
                  alt=''
                />
              </Avatar>
              {isProcessingImage && (
                <div className='absolute inset-0 flex items-center justify-center'>
                  <Spinner />
                </div>
              )}

              {!image && !isProcessingImage ? (
                <div className='absolute inset-0 flex items-center justify-center'>
                  <LucideImageOff />
                </div>
              ) : (
                <Button
                  variant='ghost'
                  disabled={!image}
                  type='button'
                  className='absolute -top-2 -right-2 z-10 rounded-full bg-default shadow-sm bg-red-100 hover:bg-red-200 dark:bg-red-900 hover:dark:bg-red-800 transition-colors'
                  size='icon-xs'
                  aria-label='Remove image'
                  title='Remove image'
                  onClick={() => onImageChange(undefined, undefined)}
                >
                  <LucideX />
                </Button>
              )}
            </div>
          </Field>
          <Field className='w-full'>
            <span className='sr-only'>Replace Image</span>
            <Input
              onChange={handleImageChange}
              className='bg-background'
              disabled={isProcessingImage}
              id={`image-${id}`}
              accept={ALLOWED_TYPES.join(',')}
              name='image'
              type='file'
            />
            <FieldDescription>Select to replace image</FieldDescription>
          </Field>
        </FieldGroup>
      </FieldSet>
    </>
  )

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) {
      return
    }
    startTransition(async () => {
      try {
        const compressedFile = await getCompressedFile(file)
        const dataUrl = await getFileDataURL(compressedFile)
        onImageChange(dataUrl, compressedFile)
      } catch (error) {
        console.error(error)
        const dataUrl = await getFileDataURL(file)
        onImageChange(dataUrl, file)
      }
    })
  }
}

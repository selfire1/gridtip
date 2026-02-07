'use client'

import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@ui/field'
import { Input } from '@ui/input'
import { Avatar, AvatarImage } from './ui/avatar'
import React from 'react'
import { getCompressedFile } from '@/lib/utils/compress-image'
import { getFileDataURL } from '@/lib/utils/file-data-url'
import { cn } from '@/lib/utils'
import { Spinner } from './ui/spinner'
import { LucideImageOff, LucideX } from 'lucide-react'
import { Button } from './ui/button'
import { ALLOWED_TYPES } from '@/lib/utils/file-limits'

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

  return (
    <>
      <Field>
        <FieldLabel htmlFor={`name-${id}`}>Name</FieldLabel>
        <Input
          autoComplete='off'
          className='bg-background'
          id={`name-${id}`}
          name='name'
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
        />
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

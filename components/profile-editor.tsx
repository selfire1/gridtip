'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import ProfileFields from '@/components/profile-fields'
import { toast } from 'sonner'
import { IconFromName } from './icon-from-name'
import { LucideEye } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import posthog from 'posthog-js'
import { AnalyticsEvent } from '@/lib/posthog/events'

type ProfileEditorProps = {
  title: string
  description: string | React.ReactNode
  icon?: string
  initialName: string
  initialImage: string | undefined
  isGlobalGroup?: boolean
  onSave: (data: { name: string; imageFile: File | undefined; imagePreview: string | undefined }) => Promise<{ ok: boolean; message: string }>
}

export function ProfileEditor({
  title,
  description,
  icon,
  initialName,
  initialImage,
  isGlobalGroup = false,
  onSave,
}: ProfileEditorProps) {
  const [name, setName] = useState(initialName)
  const [imagePreview, setImagePreview] = useState<string | undefined>(initialImage)
  const [imageFile, setImageFile] = useState<File | undefined>()
  const [isPending, startTransition] = useTransition()

  const hasChanges =
    name !== initialName ||
    imagePreview !== initialImage ||
    imageFile !== undefined

  function handleImageChange(preview: string | undefined, file?: File) {
    setImagePreview(preview)
    setImageFile(file)

    // Track image upload/removal
    if (file) {
      posthog.capture(AnalyticsEvent.PROFILE_IMAGE_UPLOADED)
    } else if (!preview) {
      posthog.capture(AnalyticsEvent.PROFILE_IMAGE_REMOVED)
    }
  }

  function handleReset() {
    setName(initialName)
    setImagePreview(initialImage)
    setImageFile(undefined)
  }

  function handleSubmit() {
    startTransition(async () => {
      const result = await onSave({ name, imageFile, imagePreview })

      if (result.ok) {
        toast.success(result.message)
        // Reset the file after successful save
        setImageFile(undefined)
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          {icon && <IconFromName size={18} iconName={icon} />}
          {title}
        </CardTitle>
        <CardDescription>
          {isGlobalGroup ? (
            <Alert className='mt-2 bg-amber-50 dark:bg-amber-950'>
              <LucideEye />
              <AlertTitle>Heads up!</AlertTitle>
              <AlertDescription>
                <p>
                  This is a <span className='font-medium'>public group</span>.
                  Make sure not to include any private information.
                </p>
              </AlertDescription>
            </Alert>
          ) : (
            description
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <ProfileFields
          id={title}
          name={name}
          image={imagePreview}
          onNameChange={setName}
          onImageChange={handleImageChange}
        />
        {hasChanges && (
          <div className='flex gap-2 justify-end'>
            <Button
              variant='outline'
              onClick={handleReset}
              disabled={isPending}
            >
              Reset
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isPending}
            >
              {isPending ? <Spinner /> : null}
              Save changes
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

import { captureException } from '@sentry/nextjs'
import { UseUploadthingProps } from '@uploadthing/react'
import { Result } from '@/actions/complete-onboarding'
import { Database } from '@/db/types'
import {
  revalidateGroupProfile,
  setGroupMemberImageToDefaultImage,
} from '@/lib/image'
import { useUploadThing } from '@/lib/uploadthing'

export function useSetGroupProfileImage(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props?: UseUploadthingProps<any>,
) {
  const { startUpload: startGroupImageUpload } = useUploadThing(
    'setGroupImage',
    props,
  )

  return {
    startUpload,
  }

  async function startUpload(
    groupId: Database.GroupId,
    {
      file,
      useDefaultImage,
    }: {
      file: File | undefined
      useDefaultImage: boolean
    },
  ) {
    try {
      // set image to default
      if (useDefaultImage) {
        await setGroupMemberImageToDefaultImage(groupId)
        return
      }
      if (file) {
        await startGroupImageUpload([file], {
          groupId,
        })
        await revalidateGroupProfile()
      }
    } catch (error) {
      captureException(error)
      return {
        ok: false,
        title: 'Image error',
        data: null,
      } satisfies Result
    }
  }
}

'use client'

import { deleteCurrentUser } from '@/actions/delete-user'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { QueryOrigin } from '@/constants'
import { getAuthLinkWithOrigin } from '@/lib/utils/auth-origin'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import * as Sentry from '@sentry/nextjs'

export default function DeleteAccount() {
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  const router = useRouter()

  return (
    <AlertDialog onOpenChange={setOpen} open={open}>
      <AlertDialogTrigger asChild>
        <Button size='sm' variant='destructive'>
          Delete account
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your
            account and remove your data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            variant='destructive'
            onClick={deleteUser}
            disabled={isPending}
          >
            {isPending && <Spinner />}
            Delete account
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )

  function deleteUser() {
    startTransition(async () => {
      try {
        const result = await deleteCurrentUser()
        if (!result.ok) {
          throw new Error(result.message)
        }
        router.push(getAuthLinkWithOrigin(QueryOrigin.Deleted))
        setOpen(false)
      } catch (error) {
        Sentry.captureException(error, {
          tags: {
            operation: 'delete-account',
            context: 'client-component',
          },
        })
        toast.error('Could not delete account', {
          description: (error as Error)?.message,
        })
      }
    })
  }
}

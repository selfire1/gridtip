'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { isCuid } from '@paralleldrive/cuid2'
import { Button } from '@ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@ui/input-group'
import {
  LinkIcon,
  LucideAlertCircle,
  LucideCheck,
  LucideChevronRight,
  LucideSearch,
} from 'lucide-react'
import posthog from 'posthog-js'
import React from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { findGroup } from '@/actions/join-group'
import Alert from '@/components/alert'
import { IconFromName } from '@/components/icon-from-name'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldSet,
} from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { AnalyticsEvent } from '@/lib/posthog/events'
import { useOnboarding } from '../_lib/onboarding-context'

export type JoinGroupData = NonNullable<
  Awaited<ReturnType<typeof findGroup>>['data']
>

export default function JoinGroupForm() {
  type FormSchema = z.infer<typeof schema>
  const { goToScreen, state, updateState } = useOnboarding()
  const schema = z.object({
    url: z
      .url({
        message: 'Invalid URL. Ask a group member to send it to you.',
      })
      .refine(
        (url) => {
          const groupId = getId(url)
          return groupId && isCuid(groupId)
        },
        { message: 'Invalid invite link' },
      ),
  })

  const initialUrl = state.joinGroupScreenData?.id
    ? `https://gridtipapp.com/join/${state.joinGroupScreenData.id}`
    : state.pendingInviteUrl || ''

  const form = useForm<FormSchema>({
    mode: 'onBlur',
    resolver: zodResolver(schema),
    defaultValues: {
      url: initialUrl,
    },
  })

  const [groupState, setGroupState] = React.useState<
    | {
        state: 'error'
        message: string
      }
    | {
        state: 'success'
        data: JoinGroupData
      }
    | {
        state: 'joined'
        data: JoinGroupData
      }
    | undefined
  >(
    state.joinGroupScreenData
      ? {
          state: 'joined',
          data: state.joinGroupScreenData,
        }
      : undefined,
  )

  const [isPending, startTransition] = React.useTransition()

  // Auto-fetch group details if we have a pending invite URL from the join page
  const hasFetchedPendingInvite = React.useRef(false)
  React.useEffect(() => {
    if (
      state.pendingInviteUrl &&
      !state.joinGroupScreenData &&
      !hasFetchedPendingInvite.current
    ) {
      hasFetchedPendingInvite.current = true
      fetchGroupFromUrl(state.pendingInviteUrl)
    }
  }, [state.pendingInviteUrl]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className='space-y-6'>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card className='grid gap-6 sm:grid-cols-2 px-6 shadow-none bg-muted/25'>
          <Card className=''>
            <CardHeader>
              <CardTitle>Enter Link</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldSet>
                <Controller
                  name='url'
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor='url'>Invitation Link</FieldLabel>
                      <InputGroup>
                        <InputGroupInput
                          disabled={isPending}
                          placeholder='https://gridtipapp.com/join/xxxxxxxxx'
                          {...field}
                          id='url'
                          type='url'
                          aria-invalid={fieldState.invalid}
                        />
                        <InputGroupAddon>
                          <LinkIcon />
                        </InputGroupAddon>
                      </InputGroup>
                      <FieldDescription>
                        Paste the invitation link to join a group.
                      </FieldDescription>
                      {fieldState.error && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </FieldSet>
              <Field className='mt-4'>
                <Button
                  type='submit'
                  disabled={isPending}
                  variant={
                    groupState?.state === 'success' ||
                    groupState?.state === 'joined'
                      ? 'secondary'
                      : 'default'
                  }
                >
                  {isPending ? <Spinner /> : <LucideSearch />}
                  Get Group Details
                </Button>
              </Field>
            </CardContent>
          </Card>
          <div>
            {groupState?.state === 'error' && (
              <Alert
                variant='destructive'
                description='Please check your link and try again. If this error persists, contact us.'
                icon={LucideAlertCircle}
                title={groupState.message}
              />
            )}
            {(groupState?.state === 'success' ||
              groupState?.state === 'joined') && (
              <GroupDetailsCard
                group={groupState.data || state.joinGroupScreenData}
                state={groupState.state}
              />
            )}
          </div>
        </Card>
      </form>
      <div className='flex justify-end'>
        <Button
          type='button'
          disabled={isPending}
          variant='ghost'
          onClick={() => {
            updateState({
              joinGroupScreenData: undefined,
            })
            goToScreen('global-group')
          }}
          size='sm'
          className='text-xs'
        >
          Continue without joining a group
          <LucideChevronRight />
        </Button>
      </div>
    </div>
  )

  function onSubmit(data: FormSchema) {
    setGroupState(undefined)
    fetchGroupFromUrl(data.url)
  }

  function fetchGroupFromUrl(url: string) {
    startTransition(async () => {
      const groupId = getId(url)
      if (!groupId) {
        setGroupState({
          state: 'error',
          message: 'Invalid URL',
        })
        return
      }
      const groupResult = await findGroup({ groupId })
      if (!groupResult.ok) {
        setGroupState({
          state: 'error',
          message: groupResult.message,
        })
        return
      }
      setGroupState({
        state: 'success',
        data: groupResult.data,
      })
    })
  }

  function getId(url: string) {
    return url.split('/').pop()
  }
}

function GroupDetailsCard({
  group,
  state,
}: {
  group: JoinGroupData
  state: 'success' | 'joined'
}) {
  const { updateState, goToScreen } = useOnboarding()

  return (
    <Card className='border-transparent shadow-none bg-transparent'>
      <CardHeader className='flex flex-col gap-2 items-center'>
        <IconFromName
          className='bg-muted rounded-lg p-2'
          iconName={group.iconName}
          size={36}
        />
        <CardTitle>{group.name}</CardTitle>
        <CardDescription>The group invites you to join.</CardDescription>
      </CardHeader>
      <CardFooter className='flex justify-center'>
        <Button size='lg' onClick={handleJoin} disabled={state === 'joined'}>
          {state === 'joined' ? (
            <>
              <LucideCheck /> Joined
            </>
          ) : (
            <>
              Join Group
              <LucideChevronRight />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )

  function handleJoin() {
    posthog.capture(AnalyticsEvent.ONBOARDING_GROUP_JOINED)
    updateState({
      joinGroupScreenData: group,
    })
    goToScreen('global-group')
  }
}

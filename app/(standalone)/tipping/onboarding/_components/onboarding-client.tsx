'use client'

import { authClient } from '@/lib/auth-client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Gauge } from '@/components/ui/gauge'
import {
  LucideChevronLeft,
  LucideChevronRight,
  LucideList,
  LucideTriangleAlert,
} from 'lucide-react'
import React, { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Path } from '@/lib/utils/path'
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
import { ButtonText } from '@/components/button-text'
import CreateGroupScreen from './screens/create-group'
import JoinGroupScreen from './screens/join-group'
import { WelcomeScreen } from './screens/welcome'
import GlobalGroupScreen from './screens/global-group'
import ProfileScreen from './screens/profile-screen'
import { useOnboarding } from '../_lib/onboarding-context'
import { cn } from '@/lib/utils'
import { Spinner } from '@/components/ui/spinner'
import { IconFromName } from '@/components/icon-from-name'

export type GroupAction = 'create' | 'join'
export default function OnboardingClient() {
  const router = useRouter()
  const { state, updateState, completeOnboarding } = useOnboarding()

  React.useState<'group-join' | 'group-create'>()

  const progressPercentage = React.useMemo(() => {
    switch (state.currentComponent) {
      case 'welcome':
      case 'welcome-initial':
        return (0 / 3) * 100
      case 'group-join':
      case 'group-create':
        return (1 / 3) * 100
      case 'global-group':
        return (2 / 3) * 100
      case 'profile':
        return (3 / 3) * 100
    }
  }, [state.currentComponent])

  const [loadingText, setLoadingText] = React.useState('Setting up…')
  const loadingTexts = [
    state.welcomeScreenSelectedGroupStep === 'create'
      ? 'Creating group…'
      : 'Joining group…',
    'Refuelling tank…',
    'Tightening wheel…',
    'Checking brakes…',
    'Sweeping gravel…',
  ]

  const renderStep = React.useMemo(() => {
    switch (state.currentComponent) {
      case 'welcome-initial':
      case 'welcome': {
        return (
          <WelcomeScreen
            isInitialLoad={state.currentComponent === 'welcome-initial'}
          />
        )
      }
      case 'group-create': {
        return <CreateGroupScreen />
      }
      case 'group-join': {
        return <JoinGroupScreen />
      }
      case 'global-group': {
        return <GlobalGroupScreen />
      }
      case 'profile': {
        return <ProfileScreen />
      }
    }
  }, [state.currentComponent])

  const goBackAction = useCallback(() => {
    switch (state.currentComponent) {
      case 'welcome-initial':
      case 'welcome':
        break
      case 'group-join':
      case 'group-create':
        updateState({
          currentComponent: 'welcome',
        })
        break
      case 'global-group':
        if (!state.welcomeScreenSelectedGroupStep) {
          updateState({
            currentComponent: 'welcome',
          })
          return
        }
        const backTarget =
          state.welcomeScreenSelectedGroupStep === 'join'
            ? 'group-join'
            : 'group-create'
        updateState({
          currentComponent: backTarget,
        })
        break
      case 'profile':
        updateState({
          currentComponent: 'global-group',
        })
    }
  }, [state, updateState])

  const [isPending, startTransition] = React.useTransition()

  return (
    <div className='max-w-screen overflow-x-hidden'>
      <div className='flex items-center justify-center min-h-svh is-container flex-col gap-16 pt-20 pb-24'>
        {renderStep}
      </div>
      <ActionBar
        render={
          state.currentComponent === 'profile' ? (
            <Button
              disabled={isPending}
              size='lg'
              onClick={handleOnboardingComplete}
            >
              {isPending && (
                <>
                  <Spinner />
                  {loadingText}
                </>
              )}
              Start Tipping
              <LucideChevronRight />
            </Button>
          ) : undefined
        }
        progress={progressPercentage}
        goBack={{
          action: goBackAction,
        }}
      />
    </div>
  )

  function handleOnboardingComplete() {
    let index = 0
    const interval = setInterval(() => {
      setLoadingText(loadingTexts[index])
      index = (index + 1) % loadingTexts.length
    }, 2000)
    startTransition(async () => {
      const logs = await completeOnboarding()
      router.push(Path.Dashboard)
      logs.forEach((log) => {
        if (log.ok) {
          toast.success(log.title, {
            description: log.description,
            icon: log.icon ? (
              <IconFromName iconName={log.icon} />
            ) : (
              <LucideList />
            ),
          })
        } else {
          toast.error(log.title, {
            description: log.description,
            icon: log.icon ? (
              <IconFromName iconName={log.icon} />
            ) : (
              <LucideTriangleAlert />
            ),
          })
        }
      })
      clearInterval(interval)
    })
  }
}

function ActionBar({
  goBack,
  progress,
  render,
}: {
  goBack: {
    action: () => void
    disabled?: boolean
  }
  progress: number
  render?: React.ReactNode
}) {
  const [isPending, startTransition] = React.useTransition()
  const router = useRouter()

  return (
    <div className='fixed z-10 bottom-0 inset-x-0 py-4 w-full px-4 flex items-center justify-between bg-background/80 backdrop-blur-xl border-t'>
      <Button
        variant='ghost'
        size='sm'
        disabled={goBack.disabled}
        onClick={goBack.action}
      >
        <LucideChevronLeft />
        Go back
      </Button>
      <div className='flex items-center gap-4'>
        <Badge
          variant='outline'
          className={cn('rounded-full px-3 py-1.5', render && 'max-sm:hidden')}
        >
          <Gauge size='small' value={progress} />
          <span className='leading-snug ml-1 text-sm'>
            <span className='hidden sm:inline'>Your </span>
            Progress
          </span>
        </Badge>
        {render}
      </div>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant='ghost' size='sm'>
            <span>
              Skip
              <span className='hidden sm:inline'> Onboarding</span>
              <span className='sm:hidden'> All</span>
            </span>
          </Button>
        </AlertDialogTrigger>
        <ConfirmationDialogContent />
      </AlertDialog>
    </div>
  )

  function ConfirmationDialogContent() {
    return (
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Skip onboarding?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to skip the onboarding process? It’s the
            fastest way to get set up.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <p>
          If you choose to skip, you can still create or join groups from the
          dashboard later.
        </p>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button type='button' onClick={handleSkip} disabled={isPending}>
            <ButtonText
              isPending={isPending}
              label='Skip Onboarding'
              pendingText='Skipping…'
            />
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    )
  }

  function handleSkip() {
    startTransition(async () => {
      const result = await authClient.updateUser({ hasSeenOnboarding: true })
      if (result.error) {
        toast.error('Could not skip onboarding', {
          description: `Please get in touch with us. Error: ${result.error.message ?? 'Unknown error'}`,
        })
        return
      }
      toast.success('Onboarding skipped', {
        description: 'Welcome to GridTip!',
      })
      router.push(Path.Dashboard)
    })
  }
}

export function getAnimation({
  delay,
  isInitialLoad = false,
}: {
  delay: number
  isInitialLoad?: boolean
}) {
  const duration = isInitialLoad ? 0.7 : 0.2
  return {
    initial: {
      opacity: 0,
      filter: isInitialLoad ? 'blur(5px)' : 'blur(2px)',
      x: isInitialLoad ? 16 : 8,
    },
    animate: { opacity: 1, filter: 'blur(0px)', x: 0 },
    transition: {
      duration,
      ease: 'easeOut' as const,
      delay: isInitialLoad ? delay : 0,
    },
  }
}

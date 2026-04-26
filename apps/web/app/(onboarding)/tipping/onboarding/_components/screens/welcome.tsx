import { motion, MotionProps } from 'motion/react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { LucideArrowRight, LucideChevronRight, LucidePlus } from 'lucide-react'
import React from 'react'
import { getAnimation } from '../onboarding-client'
import { Card, CardDescription, CardHeader } from '@/components/ui/card'
import ScreenLayout from '../screen-layout'
import { useOnboarding } from '../../_lib/onboarding-context'
import posthog from 'posthog-js'
import { AnalyticsEvent } from '@/lib/posthog/events'

export function WelcomeScreen({ isInitialLoad }: { isInitialLoad: boolean }) {
  const { state, updateState, goToScreen: goToComponent } = useOnboarding()

  return (
    <ScreenLayout
      isInitialLoad={isInitialLoad}
      title={
        state.profileDefaultData?.name
          ? `Welcome, ${state.profileDefaultData?.name}`
          : 'Welcome'
      }
      description={
        <>
          <p className='pb-2'>
            Thanks for joining us on the Grid. Let’s get you set up.
          </p>
          <p>
            <span className='font-medium'>Groups</span> are where all the fun
            happens–you gather with your mates to predict races, score points
            and rank on the leaderboard.
          </p>
          <p>Get started by creating a new group or joining an existing one.</p>
        </>
      }
      content={
        <div className='flex flex-col sm:flex-row items-stretch justify-center gap-4 sm:gap-8 w-full'>
          <GroupOptionCard
            animation={getAnimation({ delay: 0.2, isInitialLoad })}
            isSelected={state.welcomeScreenSelectedGroupStep === 'create'}
            setSelected={() => {
              posthog.capture(AnalyticsEvent.ONBOARDING_GROUP_ACTION_SELECTED, {
                action: 'create',
              })
              updateState({
                welcomeScreenSelectedGroupStep: 'create',
              })
            }}
            ariaLabel='Select creating a group'
            icon={<LucidePlus />}
            heading='Create Group'
            description='Start by creating a new group. You can invite friends through a link. Click to select.'
          />
          <GroupOptionCard
            animation={getAnimation({ delay: 0.25, isInitialLoad })}
            isSelected={state.welcomeScreenSelectedGroupStep === 'join'}
            setSelected={() => {
              posthog.capture(AnalyticsEvent.ONBOARDING_GROUP_ACTION_SELECTED, {
                action: 'join',
              })
              updateState({
                welcomeScreenSelectedGroupStep: 'join',
              })
            }}
            ariaLabel='Select joining a group'
            icon={<LucideArrowRight />}
            heading='Join Group'
            description='Join an existing group. You will need an invite link. Click to select.'
          />
        </div>
      }
      footer={
        <motion.div
          className='flex flex-col gap-2'
          {...getAnimation({ delay: 0.35, isInitialLoad })}
        >
          <Button
            size='lg'
            disabled={!state.welcomeScreenSelectedGroupStep}
            onClick={handleContinue}
          >
            Continue
            <LucideChevronRight />
          </Button>
          <p
            aria-hidden={Boolean(state.welcomeScreenSelectedGroupStep)}
            className={cn(
              'text-sm text-muted-foreground',
              state.welcomeScreenSelectedGroupStep &&
                'opacity-0 transition-opacity duration-100',
            )}
          >
            Select an option to continue
          </p>
        </motion.div>
      }
    />
  )

  function handleContinue() {
    const component =
      state.welcomeScreenSelectedGroupStep === 'create'
        ? 'group-create'
        : 'group-join'
    goToComponent(component)
  }
}

function GroupOptionCard({
  isSelected,
  setSelected,
  ariaLabel,
  icon,
  heading,
  description,
  animation,
}: {
  isSelected: boolean
  setSelected: () => void
  ariaLabel: string
  icon: React.ReactNode
  heading: string
  description: string
  animation: MotionProps
}) {
  return (
    <motion.div {...animation} className='w-full max-w-md'>
      <Card
        className={cn(
          'pt-0 overflow-hidden relative border transition-all group',
          isSelected && 'border-primary shadow-lg',
        )}
      >
        <button
          className='absolute inset-0 z-10 cursor-pointer'
          onClick={setSelected}
          aria-label={ariaLabel}
        ></button>
        <div className='w-full py-8 sm:py-12 bg-muted border-b flex flex-col items-center justify-center gap-2 group-hover:bg-primary/10 transition-colors'>
          <div className='rounded-full size-8 flex items-center justify-center bg-background border'>
            {icon}
          </div>
          <h2 className='text-xl tracking-tight font-semibold'>{heading}</h2>
        </div>
        <CardHeader>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
    </motion.div>
  )
}

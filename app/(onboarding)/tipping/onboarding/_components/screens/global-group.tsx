'use client'

import React from 'react'
import { getAnimation } from '../onboarding-client'
import ScreenLayout from '../screen-layout'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { joinGlobalGroup } from '@/actions/join-group'
import { toast } from 'sonner'
import { useOnboarding } from '../../_lib/onboarding-context'

export default function GlobalGroupScreen() {
  const { goToScreen, updateState } = useOnboarding()
  return (
    <ScreenLayout
      isInitialLoad={false}
      title={
        <span className='flex flex-col sm:flex-row items-center gap-2 justify-center'>
          <div className='flex items-center'>
            <WreathSide side='left' className='shrink-0 sm:hidden' />
            <WreathSide side='right' className='shrink-0 sm:hidden' />
          </div>
          <WreathSide side='left' className='shrink-0 hidden sm:block' />
          Global Leaderboard
          <WreathSide side='right' className='shrink-0 hidden sm:block' />
        </span>
      }
      description={
        <div className='space-y-4'>
          <p>
            Want to see how you rank against all GridTip users? The Global
            Leaderboard is a public group where everyone competes together.
          </p>
          <p className='text-sm'>
            You can join or leave anytime. Customise your public profile in the
            next step.
          </p>
        </div>
      }
      content={
        <div className='flex flex-col-reverse sm:flex-row items-center gap-4'>
          <motion.div {...getAnimation({ delay: 0.2, isInitialLoad: false })}>
            <Button onClick={handleSkip} variant='outline'>
              Skip for now
            </Button>
          </motion.div>
          <motion.div {...getAnimation({ delay: 0.25, isInitialLoad: false })}>
            <Button onClick={handleJoin}>Join Global Leaderboard</Button>
          </motion.div>
        </div>
      }
    />
  )

  function handleSkip() {
    goToScreen('profile')
  }

  function handleJoin() {
    updateState({
      globalGroupScreenData: {
        isJoin: true,
      },
    })
    goToScreen('profile')
  }
}

// function Wreath({ className }: { className?: string }) {
//   return (
//     <svg
//       xmlns='http://www.w3.org/2000/svg'
//       viewBox='0 0 24 24'
//       className={className}
//     >
//       <g
//         fill='none'
//         stroke='currentColor'
//         strokeLinecap='round'
//         strokeLinejoin='round'
//         strokeWidth='2'
//       >
//         <path d='M6.436 8A8.6 8.6 0 0 0 6 10.727C6 14.744 8.686 18 12 18s6-3.256 6-7.273A8.6 8.6 0 0 0 17.564 8M14.5 21s-.682-3-2.5-3s-2.5 3-2.5 3m9.02-15.77C18.812 6.896 17.5 8 17.5 8s-1.603-.563-1.895-2.23C15.313 4.104 16.625 3 16.625 3s1.603.563 1.895 2.23' />
//         <path d='M21.094 12.14c-1.281 1.266-3.016.76-3.016.76s-.454-1.772.828-3.04c1.28-1.266 3.016-.76 3.016-.76s.454 1.772-.828 3.04m-3.36 6.686c-1.5-.575-1.734-2.19-1.734-2.19s1.267-1.038 2.767-.462c1.5.575 1.733 2.19 1.733 2.19s-1.267 1.038-2.767.462m-11.466 0c1.5-.575 1.733-2.19 1.733-2.19s-1.267-1.038-2.767-.462c-1.5.575-1.733 2.19-1.733 2.19s1.267 1.038 2.767.462M2.906 12.14c1.281 1.266 3.016.76 3.016.76s.454-1.772-.828-3.04C3.813 8.595 2.078 9.1 2.078 9.1s-.454 1.772.828 3.04M5.48 5.23C5.188 6.896 6.5 8 6.5 8s1.603-.563 1.895-2.23C8.687 4.104 7.375 3 7.375 3s-1.603.563-1.895 2.23' />
//       </g>
//     </svg>
//   )
// }

function WreathSide({
  side,
  className,
}: {
  side: 'right' | 'left'
  className?: string
}) {
  if (side === 'right') {
    return (
      <svg
        xmlns='http://www.w3.org/2000/svg'
        width='32'
        height='32'
        className={className}
        viewBox='0 0 24 24'
      >
        <path
          fill='none'
          stroke='currentColor'
          strokeLinejoin='round'
          strokeWidth='1.5'
          d='M16.756 6.611c.213 1.642-1.104 3.166-1.104 3.166s-1.663-1.138-1.877-2.78C13.562 5.353 14.88 3.83 14.88 3.83s1.663 1.139 1.877 2.781Zm1.561 5.519c-.696 1.503-2.624 2.093-2.624 2.093s-.8-1.847-.104-3.35s2.625-2.094 2.625-2.094s.8 1.848.103 3.351Zm-.82 5.285c-1.328.993-3.306.599-3.306.599s.176-2.005 1.504-2.998s3.306-.599 3.306-.599s-.176 2.005-1.504 2.998Zm-3.609 4.298c-1.505.698-3.359-.095-3.359-.095s.587-1.925 2.092-2.624c1.505-.698 3.358.096 3.358.096s-.586 1.925-2.091 2.623ZM12.22 2.968c1.21 1.133 1.164 3.144 1.164 3.144s-2.01.176-3.22-.957S9 2.01 9 2.01s2.01-.175 3.22.958Z'
        />
      </svg>
    )
  }

  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      className={className}
      width='32'
      height='32'
      viewBox='0 0 24 24'
    >
      <path
        fill='none'
        stroke='currentColor'
        strokeLinejoin='round'
        strokeWidth='1.5'
        d='M9.246 6.611c-.213 1.642 1.104 3.166 1.104 3.166s1.663-1.138 1.876-2.78c.213-1.643-1.104-3.167-1.104-3.167S9.46 4.97 9.246 6.611ZM7.683 12.13c.696 1.503 2.624 2.093 2.624 2.093s.8-1.847.104-3.35s-2.624-2.094-2.624-2.094s-.8 1.848-.104 3.351Zm.821 5.285c1.328.993 3.306.599 3.306.599s-.176-2.005-1.504-2.998S7 14.417 7 14.417s.176 2.005 1.504 2.998Zm3.609 4.298c1.505.698 3.359-.095 3.359-.095s-.587-1.925-2.092-2.624c-1.505-.698-3.358.096-3.358.096s.586 1.925 2.091 2.623Zm1.668-18.745c-1.21 1.133-1.164 3.144-1.164 3.144s2.01.176 3.22-.957s1.164-3.145 1.164-3.145s-2.01-.175-3.22.958Z'
      />
    </svg>
  )
}

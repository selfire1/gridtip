import { motion } from 'motion/react'
import { getAnimation } from './onboarding-client'

export default function ScreenLayout({
  title,
  description,
  overline,
  content,
  footer,
  isInitialLoad,
}: {
  isInitialLoad: boolean
  title: string | React.ReactNode
  overline?: React.ReactNode
  description: React.ReactNode
  content: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <>
      <div className='text-center max-w-prose mx-auto space-y-6'>
        {overline}
        <motion.h1
          className='text-primary leading-tighter text-4xl font-semibold tracking-tight text-balance lg:leading-[1.1] xl:text-5xl xl:tracking-tighter'
          {...getAnimation({ delay: 0, isInitialLoad })}
        >
          {title}
        </motion.h1>
        <motion.div
          className='text-balance text-muted-foreground max-w-prose text-center space-y-2'
          {...getAnimation({ delay: 0.1, isInitialLoad })}
        >
          {description}
        </motion.div>
      </div>
      {content}
      {footer}
    </>
  )
}

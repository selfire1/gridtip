import React from 'react'
import { getAnimation } from '../onboarding-client'
import ScreenLayout from '../screen-layout'
import { motion } from 'motion/react'
import JoinGroupForm from '../join-group-form'

export default function JoinGroupScreen() {
  return (
    <ScreenLayout
      isInitialLoad={false}
      title='Join Group'
      description={
        <p>
          You can join a group with an invitation link that a group member sent
          to you.
        </p>
      }
      content={
        <motion.div
          className='w-full max-w-3xl'
          {...getAnimation({ delay: 0.2, isInitialLoad: false })}
        >
          <JoinGroupForm />
        </motion.div>
      }
    />
  )
}

import React from 'react'
import { getAnimation } from '../onboarding-client'
import CreateGroupForm from '../create-group-form'
import ScreenLayout from '../screen-layout'
import { motion } from 'motion/react'

export default function CreateGroupScreen() {
  return (
    <ScreenLayout
      isInitialLoad={false}
      title='Create Group'
      description={
        <p>
          Start a new group for your mates. You can invite them after completing
          the setup.
        </p>
      }
      content={
        <motion.div
          className='w-full max-w-xl'
          {...getAnimation({ delay: 0.2, isInitialLoad: false })}
        >
          <CreateGroupForm />
        </motion.div>
      }
    />
  )
}

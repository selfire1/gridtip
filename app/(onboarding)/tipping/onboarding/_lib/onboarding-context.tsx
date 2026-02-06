'use client'

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from 'react'
import { GroupAction } from '../_components/onboarding-client'
import { Schema as CreateGroupSchema } from '@/lib/schemas/create-group'
import { JoinGroupData } from '../_components/join-group-form'
import { ProfileState } from '../_components/screens/profile-screen'
import { DalUser } from '@/lib/dal'
import {
  joinOrCreateGroupAndUpdateProfileAction,
  processGlobalGroupOnboardingAction,
  completeProfileOnboardingAction,
  type Log,
} from '@/actions/complete-onboarding'

type ComponentKey =
  | 'welcome-initial'
  | 'welcome'
  | 'group-join'
  | 'group-create'
  | 'global-group'
  | 'profile'

export type OnboardingState = {
  currentComponent: ComponentKey
  welcomeScreenSelectedGroupStep?: GroupAction

  createGroupScreenData?: CreateGroupSchema
  joinGroupScreenData?: JoinGroupData

  globalGroupScreenData?: { isJoin: boolean }

  profileDefaultData?: ProfileState
  profileGlobalGroupData?: ProfileState
  profileJoinGroupData?: ProfileState
  profileCreateGroupData?: ProfileState
}

type OnboardingContextType = {
  state: OnboardingState
  updateState: (updates: Partial<OnboardingState>) => void
  completeOnboarding: () => Promise<Log[]>
  goToScreen: (component: ComponentKey) => void
}

const OnboardingContext = createContext<OnboardingContextType | null>(null)

export function OnboardingProvider({
  children,
  user,
}: {
  children: ReactNode
  user: DalUser
}) {
  const defaultProfileData = {
    name: user.name,
    imagePreview: user.profileImageUrl || user.image || undefined,
    imageFile: undefined,
  } satisfies ProfileState
  const [state, setState] = useState<OnboardingState>({
    currentComponent: 'welcome-initial',
    profileDefaultData: defaultProfileData,
    profileGlobalGroupData: defaultProfileData,
    profileJoinGroupData: defaultProfileData,
    profileCreateGroupData: defaultProfileData,
  })

  const goToScreen = useCallback((component: ComponentKey) => {
    setState((prevState) => ({
      ...prevState,
      currentComponent: component,
    }))
  }, [])

  const updateState = useCallback((updates: Partial<OnboardingState>) => {
    setState((prevState) => ({
      ...prevState,
      ...updates,
    }))
  }, [])

  const completeOnboarding = useCallback(async () => {
    const logs = (
      await Promise.all([
        runGroupOnboardingAction(state),
        processGlobalGroupOnboardingAction({
          shouldJoin: state.globalGroupScreenData?.isJoin ?? false,
          profileName: state.profileGlobalGroupData?.name,
          profileImage: state.profileGlobalGroupData?.imageFile,
        }),
        completeProfileOnboardingAction({
          name: state.profileDefaultData?.name,
          profileImage: state.profileDefaultData?.imageFile,
        }),
      ])
    ).flat()
    return logs
  }, [state])

  return (
    <OnboardingContext.Provider
      value={{ state, updateState, completeOnboarding, goToScreen }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (!context) {
    throw new Error('useOnboarding must be used within a OnboardingProvider')
  }
  return context
}

async function runGroupOnboardingAction(state: OnboardingState) {
  const action = state.welcomeScreenSelectedGroupStep
  if (!action) {
    return []
  }

  const input = getInput()
  const logs = await joinOrCreateGroupAndUpdateProfileAction(input)
  return logs

  function getInput() {
    if (action === 'create') {
      return {
        action: 'create' as const,
        profileData: state.profileCreateGroupData,
        groupData: state.createGroupScreenData,
      }
    }
    return {
      action: 'join' as const,
      profileData: state.profileJoinGroupData,
      groupData: {
        id: state.joinGroupScreenData?.id,
        name: state.joinGroupScreenData?.name,
      },
    }
  }
}

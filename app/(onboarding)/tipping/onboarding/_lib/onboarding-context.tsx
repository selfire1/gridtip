'use client'

import { captureException } from '@sentry/nextjs'
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { toast } from 'sonner'
import {
  createOrJoinPrimaryGroup,
  joinGlobalGroupWrapper,
  type Result,
} from '@/actions/complete-onboarding'
import { authClient } from '@/lib/auth-client'
import { type DalUser } from '@/lib/dal'
import {
  revalidateGroupProfile,
  setCurrentGroupMemberImageToDefaultImage,
} from '@/lib/image'
import { useUploadThing } from '@/lib/uploadthing'
import { consumePendingInviteUrlFromLocalStorage } from '@/lib/utils/pending-invite'
import { OnboardingCreateGroupFormData } from '../_components/create-group-form'
import { JoinGroupData } from '../_components/join-group-form'
import { GroupAction } from '../_components/onboarding-client'
import { ProfileState } from '../_components/screens/profile-screen'

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

  createGroupScreenData?: OnboardingCreateGroupFormData
  joinGroupScreenData?: JoinGroupData

  pendingInviteUrl?: string

  globalGroupScreenData?: { isJoin: boolean }

  profileDefaultData?: ProfileState
  profileGlobalGroupData?: ProfileState
  profileJoinGroupData?: ProfileState
  profileCreateGroupData?: ProfileState
}

type OnboardingContextType = {
  state: OnboardingState
  updateState: (updates: Partial<OnboardingState>) => void
  completeOnboarding: () => Promise<Result[]>
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

  useEffect(() => {
    const url = consumePendingInviteUrlFromLocalStorage()
    if (url) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState((prev) => ({
        ...prev,
        pendingInviteUrl: url,
        welcomeScreenSelectedGroupStep: 'join',
      }))
    }
  }, [])

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

  const { startUpload: startGroupImageUpload } = useUploadThing(
    'setGroupImage',
    {
      onClientUploadComplete: () => {
        revalidateGroupProfile()
      },
      onUploadError: (error) => {
        captureException(error)
        toast.error('Image upload error', {
          description: 'Failed to upload image for group',
        })
      },
    },
  )
  const { startUpload: startUserImageUpload } = useUploadThing('setUserImage', {
    onUploadError: (error) => {
      captureException(error)
      toast.error('Image upload error', {
        description: 'Failed to upload your default image',
      })
    },
  })

  const completeOnboarding = useCallback(async () => {
    const logs: Result[] = []
    try {
      const action = state.welcomeScreenSelectedGroupStep
      const name =
        action === 'create'
          ? state.profileCreateGroupData?.name
          : state.profileJoinGroupData?.name
      const primaryGroupResult = await createOrJoinPrimaryGroup({
        action,
        name,
        createData: state.createGroupScreenData,
        joinData: state.joinGroupScreenData,
      })
      logs.push(primaryGroupResult)

      // update image
      if (primaryGroupResult.ok) {
        const profileData =
          action === 'create'
            ? state.profileCreateGroupData
            : state.profileJoinGroupData
        const hasUserNotRemovedDefaultImage = !!(
          profileData?.imagePreview && !profileData.imageFile
        )
        const groupId = primaryGroupResult.data.group.id
        try {
          // set image to default
          if (hasUserNotRemovedDefaultImage) {
            await setCurrentGroupMemberImageToDefaultImage(groupId)
          } else if (profileData?.imageFile) {
            // upload image
            startGroupImageUpload([profileData.imageFile], {
              groupId,
            })
          }
        } catch (error) {
          captureException(error)
          logs.push({
            ok: false,
            title: 'Image error',
            description: `Could not update image for ${primaryGroupResult.data.group.name}`,
            data: null,
          })
        }
      }

      const shouldJoinGlobalGroup = state.globalGroupScreenData?.isJoin

      if (shouldJoinGlobalGroup) {
        const name = state.profileGlobalGroupData?.name

        const joinGroupResult = await joinGlobalGroupWrapper({
          profileName: name,
        })

        if (joinGroupResult) {
          logs.push(joinGroupResult)
        }

        if (joinGroupResult?.ok) {
          const profileData = {
            imageFile: state.profileGlobalGroupData?.imageFile,
            imagePreview: state.profileGlobalGroupData?.imagePreview,
          }
          const hasUserNotRemovedDefaultImage = !!(
            profileData?.imagePreview && !profileData.imageFile
          )
          const groupId = joinGroupResult.data.group.id
          try {
            // set image to default
            if (hasUserNotRemovedDefaultImage) {
              await setCurrentGroupMemberImageToDefaultImage(groupId)
            } else if (profileData?.imageFile) {
              // upload image
              startGroupImageUpload([profileData.imageFile], {
                groupId,
              })
            }
          } catch (error) {
            captureException(error)
            logs.push({
              ok: false,
              title: 'Image error',
              description: 'Could not update image for global group',
              data: null,
            })
          }
        }
      }

      if (state.profileDefaultData?.name) {
        try {
          await authClient.updateUser({
            name: state.profileDefaultData.name,
          })
        } catch (error) {
          captureException(error)
          logs.push({
            ok: false,
            title: 'Name error',
            description: 'Could not update name',
            data: null,
          })
        }
      }

      if (state.profileDefaultData?.imageFile) {
        startUserImageUpload([state.profileDefaultData.imageFile])
      }

      return logs
    } catch (error) {
      toast.error('Onboarding failed', {
        description: 'Please get in touch with us.',
      })
      console.error('Onboarding failed:', error)
      return []
    }
  }, [state, startGroupImageUpload, startUserImageUpload])

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

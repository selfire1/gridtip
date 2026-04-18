import Constants from 'expo-constants'

export const apiBaseUrl = Constants.expoConfig?.extra?.apiBaseUrl
if (!apiBaseUrl) {
  throw new Error('No apiBaseUrl')
}

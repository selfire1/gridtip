import { ExpoConfig, ConfigContext } from 'expo/config'

export default ({ config }: ConfigContext): ExpoConfig => ({
  name: 'GridTip',
  scheme: 'gridtip',
  slug: 'gridtip',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  ios: {
    icon: './assets/app.icon',
    bundleIdentifier: 'com.gridtipapp',
    // deploymentTarget: '17.0',

    config: {
      usesNonExemptEncryption: false,
    },
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
    bundler: 'metro',
  },
  plugins: [
    'expo-router',
    [
      'expo-secure-store',
      {
        configureAndroidBackup: true,
        faceIDPermission: 'Allow $(PRODUCT_NAME) to access your Face ID biometric data.',
      },
    ],
    [
      'expo-build-properties',
      {
        ios: {
          deploymentTarget: '26.0',
        },
      },
    ],
    [
      'expo-splash-screen',
      {
        backgroundColor: '#F5F5F5',
        image: './assets/images/splash-icon-light.png',
        dark: {
          image: './assets/images/splash-icon-dark.png',
          backgroundColor: '#262626',
        },
        imageWidth: 200,
      },
    ],
    'expo-image',
    'expo-secure-store',
    'expo-web-browser',
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    eas: {
      projectId: '85a9d8ac-9119-41fd-8e84-a9a0546f0128',
    },
    apiBaseUrl:
      process.env.ENVIRONMENT === 'development'
        ? 'http://localhost:4848'
        : 'https://gridtipapp.com',
  },
})

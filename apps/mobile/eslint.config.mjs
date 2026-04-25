import { defineConfig } from 'eslint/config'
import expoConfig from 'eslint-config-expo/flat'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import pluginQuery from '@tanstack/eslint-plugin-query'

export default defineConfig([
  ...pluginQuery.configs['flat/recommended-strict'],

  expoConfig,
  eslintPluginPrettierRecommended,
  {
    ignores: ['dist/*'],
    rules: {
      'prettier/prettier': 0,
    },
  },
])

const { defineConfig } = require('eslint/config')
const expoConfig = require('eslint-config-expo/flat')
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended')
const pluginQuery = require('@tanstack/eslint-plugin-query')

module.exports = defineConfig([
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

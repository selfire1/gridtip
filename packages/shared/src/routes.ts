export const webRoutes = {
  leaderboard: '/tipping/leaderboard',
  championships: '/tipping/championships',
  groups: '/tipping/groups',
  rules: '/tipping/rules',
  settings: '/tipping/settings',
  feedback: '/tipping/contact',
  privacy: '/privacy',
} as const

export type WebRouteKey = keyof typeof webRoutes

/**
 * PostHog Analytics Event Constants
 *
 * All analytics events follow snake_case naming convention.
 * Format: area_action (e.g., landing_cta_clicked, onboarding_started)
 *
 * Note: All tracking is anonymous - no PII (personally identifiable information)
 * is captured. No user_id, email, name, or group_id.
 */

export const AnalyticsEvent = {
  // Landing Page Events
  LANDING_CTA_CLICKED: 'landing_cta_clicked',
  LANDING_LEARN_MORE_CLICKED: 'landing_learn_more_clicked',
  LANDING_BANNER_CTA_CLICKED: 'landing_banner_cta_clicked',

  // Authentication Events
  AUTH_SIGNUP_STARTED: 'auth_signup_started',
  AUTH_SIGNUP_COMPLETED: 'auth_signup_completed',
  AUTH_LOGIN_STARTED: 'auth_login_started',
  AUTH_LOGIN_COMPLETED: 'auth_login_completed',
  AUTH_EMAIL_VERIFIED: 'auth_email_verified',

  // Onboarding Events
  ONBOARDING_STARTED: 'onboarding_started',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  ONBOARDING_SKIPPED: 'onboarding_skipped',
  ONBOARDING_STEP_VIEWED: 'onboarding_step_viewed',
  ONBOARDING_STEP_COMPLETED: 'onboarding_step_completed',
  ONBOARDING_BACK_CLICKED: 'onboarding_back_clicked',
  ONBOARDING_GROUP_ACTION_SELECTED: 'onboarding_group_action_selected',
  ONBOARDING_GROUP_CREATED: 'onboarding_group_created',
  ONBOARDING_GROUP_JOINED: 'onboarding_group_joined',
  ONBOARDING_GLOBAL_GROUP_JOINED: 'onboarding_global_group_joined',
  ONBOARDING_GLOBAL_GROUP_SKIPPED: 'onboarding_global_group_skipped',
  ONBOARDING_PROFILE_COMPLETED: 'onboarding_profile_completed',

  // Group Management Events
  GROUP_CREATED: 'group_created',
  GROUP_JOINED: 'group_joined',
  GROUP_JOINED_VIA_LINK: 'group_joined_via_link',
  GROUP_LEFT: 'group_left',
  GROUP_EDITED: 'group_edited',
  GROUP_INVITE_LINK_COPIED: 'group_invite_link_copied',
  GROUP_SWITCHED: 'group_switched',

  // Tipping Events
  TIPS_FORM_VIEWED: 'tips_form_viewed',
  TIPS_SUBMITTED: 'tips_submitted',
  TIPS_EDITED: 'tips_edited',
  TIPS_FIELD_CHANGED: 'tips_field_changed',

  // Championship Events
  CHAMPIONSHIP_TIPS_VIEWED: 'championship_tips_viewed',
  CHAMPIONSHIP_TIPS_SUBMITTED: 'championship_tips_submitted',

  // Leaderboard Events
  LEADERBOARD_VIEWED: 'leaderboard_viewed',
  LEADERBOARD_RACE_SELECTED: 'leaderboard_race_selected',

  // Dashboard Events
  DASHBOARD_VIEWED: 'dashboard_viewed',
  DASHBOARD_CARD_CLICKED: 'dashboard_card_clicked',

  // Global Leaderboard Events
  GLOBAL_LEADERBOARD_JOINED: 'global_leaderboard_joined',

  // Invitation Flow Events
  INVITE_LINK_VIEWED: 'invite_link_viewed',
  INVITE_SIGNUP_CLICKED: 'invite_signup_clicked',
  INVITE_LOGIN_CLICKED: 'invite_login_clicked',
} as const

export type AnalyticsEventName =
  (typeof AnalyticsEvent)[keyof typeof AnalyticsEvent]

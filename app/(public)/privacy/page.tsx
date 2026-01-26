import { marked } from 'marked'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
}

export default function Privacy() {
  return (
    <div className='py-12 is-container space-y-12'>
      <div className='text-center max-w-prose mx-auto space-y-4'>
        <h1 className='text-primary leading-tighter text-4xl font-semibold tracking-tight text-balance lg:leading-[1.1] xl:text-5xl xl:tracking-tighter'>
          Privacy Policy
        </h1>
        <p className='text-balance text-muted-foreground'>
          Learn more about how we collect, use, and protect your information
        </p>
      </div>

      <div
        className='typography'
        dangerouslySetInnerHTML={{
          __html: getHtmlFromMarkdown(getContents()),
        }}
      />
    </div>
  )

  function getHtmlFromMarkdown(markdown: string) {
    return marked.parse(markdown)
  }
  function getContents() {
    return `
**Last updated:** January 2026

This Privacy Policy explains how Glau Digital ("we", "us", "our") collects, uses, and protects your information when you use GridTip.

## Information We Collect

When you use GridTip, we collect:

- **Account information**: Email address, username, and profile photo
- **Authentication data**: Information from Google when you sign in using Google authentication
- **Usage data**: Anonymised information about how you use the app, collected via PostHog
- **Error data**: Anonymised technical information when errors occur, collected via Sentry

## How We Use Your Information

We use your information to:

- Create and manage your account
- Display your profile to other group members
- Send email notifications about your groups and predictions (you can opt out of these at any time)
- Improve the app through anonymised analytics
- Identify and fix technical issues

## Data Sharing

We do not sell your personal information. We share data only with:

- **PostHog**: Receives anonymised usage analytics
- **Sentry**: Receives anonymised error reports
- **Google**: Processes authentication when you sign in with Google

We may also disclose your information where required by Australian law, such as to comply with a court order, legal process, or lawful request from government authorities.

## Data Security

We take reasonable steps to protect your personal information from misuse, interference, loss, and unauthorised access or disclosure. Your data is stored securely using industry-standard practices.

## Data Retention

We retain your information until you choose to delete your account. Upon account deletion, your personal data will be removed from our systems.

## Your Rights

You have the right to:

- **Delete your account**: You can delete your account and all associated data at any time through the app
- **Export your data**: Contact us to request a copy of your data
- **Opt out of emails**: Manage your notification preferences in your account settings

## Contact Us

If you have questions about this Privacy Policy or your data, contact us at gridtip@joschua.io

## Changes to This Policy

We may update this Privacy Policy from time to time. We will notify you of any significant changes by email or through the app.

---

Glau Digital  
Queensland, Australia
`.trim()
  }
}

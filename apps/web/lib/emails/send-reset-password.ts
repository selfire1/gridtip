import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendResetPasswordEmail({
  user,
  url,
}: {
  user: { name: string; email: string }
  url: string
}) {
  try {
    const { error } = await resend.emails.send({
      from: 'GridTip <gridtip@noreply.joschua.io>',
      to: [user.email],
      subject: 'Reset your password',
      html: `
<h1>Reset your <strong>GridTip</strong> password</h1>

Hi ${user.name}, click the link below to choose a new password: <a href="${url}">${url}</a>

This link expires in one hour. If you didn't ask for this, you can ignore this email.`.trim(),
    })

    if (error) {
      console.error(error)
    }
  } catch (error) {
    console.error(error)
  }
}

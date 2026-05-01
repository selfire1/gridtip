import { auth } from '@/lib/auth'

main()

async function main() {
  try {
    const res = await auth.api.signUpEmail({
      body: {
        name: 'John Appleseed',
        email: 'johnappleseed@test.com',
        password: 'johnappleseed_test123',
      },
    })
    console.log('Sign up successful:', res)
  } catch (error) {
    console.log('Sign up failed:', error)
  }
}

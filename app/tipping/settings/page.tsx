import { Metadata } from 'next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import DeleteAccount from './_components/delete-account'

export const metadata: Metadata = {
  title: 'Settings',
}
export default function SettingsPage() {
  return (
    <>
      <DeleteCard />
    </>
  )

  function DeleteCard() {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <DeleteAccount />
        </CardContent>
      </Card>
    )
  }
}

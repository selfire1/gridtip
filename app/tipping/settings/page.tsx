import { Metadata } from 'next'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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

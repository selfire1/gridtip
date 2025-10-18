import { Metadata } from 'next'
import { LucideArrowUpRight } from 'lucide-react'
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
import { HREF_LINKS } from '@/constants'

export const metadata: Metadata = {
  title: 'Contact',
}

export default function ContactPage() {
  return (
    <div className='grid is-grid-card-fit gap-8'>
      <Card>
        <CardHeader>
          <CardTitle>Bug Reports and Feature Requests</CardTitle>
          <CardDescription>
            Found a bug or want to request a feature? The easiest way to leave
            feedback is to create an issue on GitHub.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild size='sm'>
            <a
              href={HREF_LINKS.GithubIssues}
              title='Github'
              target='_blank'
              rel='noopener noreferrer'
            >
              Create issue
              <LucideArrowUpRight />
            </a>
          </Button>
        </CardFooter>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Contact</CardTitle>
          <CardDescription>
            Have another question or suggestion? I’d love to hear from you!
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild size='sm' variant='outline'>
            <a
              href={HREF_LINKS.Email}
              title='Send email'
              target='_blank'
              rel='noopener noreferrer'
            >
              Send email
              <LucideArrowUpRight />
            </a>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

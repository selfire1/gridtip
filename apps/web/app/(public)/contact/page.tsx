import ContactCards from '@/components/contact-cards'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Get in touch with the GridTip team to report an issue or send a suggestion.',
}

export default function ContactPage() {
  return (
    <div className='py-12 is-container space-y-12'>
      <div className='text-center max-w-prose mx-auto space-y-4'>
        <h1 className='text-primary leading-tighter text-4xl font-semibold tracking-tight text-balance lg:leading-[1.1] xl:text-5xl xl:tracking-tighter'>
          Contact
        </h1>
        <p className='text-balance text-muted-foreground'>
          Get in touch to report in issue or just to say hi!
        </p>
      </div>

      <div className='grid gap-8 sm:grid-cols-2'>
        <ContactCards />
      </div>
    </div>
  )
}

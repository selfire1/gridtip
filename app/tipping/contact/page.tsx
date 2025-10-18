import { Metadata } from 'next'
import ContactCards from '@/components/contact-cards'

export const metadata: Metadata = {
  title: 'Contact',
}

export default function ContactPage() {
  return (
    <div className='grid is-grid-card-fit gap-8'>
      <ContactCards />
    </div>
  )
}

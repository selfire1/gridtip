'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import Link from 'next/link'

export default function Home() {
  return (
    <div className='space-y-32 py-16 md:space-y-40 md:py-20'>
      {/* Hero Section */}
      <section className='is-container'>
        <div className='grid gap-12 lg:grid-cols-2 lg:gap-16 items-center'>
          <div className='space-y-6'>
            <h1 className='text-4xl font-bold tracking-tight lg:text-5xl xl:text-6xl'>
              Lorem Ipsum Dolor Sit
            </h1>
            <p className='text-lg text-muted-foreground'>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
            <div className='flex gap-4'>
              <Button size='lg' asChild>
                <Link href='/auth'>Get Started</Link>
              </Button>
              <Button size='lg' variant='outline' asChild>
                <Link href='#'>Learn More</Link>
              </Button>
            </div>
          </div>
          <div className='bg-gray-300 rounded-3xl aspect-video w-full' />
        </div>
      </section>

      {/* Social Proof Section */}
      <section className='is-container'>
        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {testimonials.map((testimonial, index) => (
            <Card key={index} className='p-6'>
              <blockquote className='text-lg mb-4'>
                "{testimonial.quote}"
              </blockquote>
              <div className='flex items-center gap-3'>
                <Avatar>
                  <AvatarFallback className='bg-gray-300' />
                </Avatar>
                <span className='font-medium'>{testimonial.name}</span>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className='is-container'>
        <h2 className='text-3xl font-bold text-center mb-12'>How It Works</h2>
        <div className='space-y-16'>
          {steps.map((step, index) => (
            <div
              key={index}
              className={`grid gap-8 lg:grid-cols-2 lg:gap-16 items-center ${
                index % 2 === 1 ? 'lg:flex-row-reverse' : ''
              }`}
            >
              <div
                className={`space-y-4 ${index % 2 === 1 ? 'lg:order-2' : ''}`}
              >
                <div className='text-sm font-semibold text-primary'>
                  Step {index + 1}
                </div>
                <h3 className='text-2xl font-bold'>{step.title}</h3>
                <p className='text-muted-foreground'>{step.description}</p>
              </div>
              <div
                className={`bg-gray-300 rounded-2xl aspect-square w-full ${
                  index % 2 === 1 ? 'lg:order-1' : ''
                }`}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Banner CTA Section */}
      <section className='bg-primary/5 border-y'>
        <div className='is-container py-16 text-center space-y-6'>
          <h2 className='text-3xl font-bold lg:text-4xl'>
            Ready to Get Started?
          </h2>
          <p className='text-lg text-muted-foreground max-w-2xl mx-auto'>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
            eiusmod tempor incididunt ut labore.
          </p>
          <Button size='lg' asChild>
            <Link href='/auth'>Start Now</Link>
          </Button>
        </div>
      </section>

      {/* FAQs Section */}
      <section className='is-container'>
        <h2 className='text-3xl font-bold text-center mb-12'>
          Frequently Asked Questions
        </h2>
        <div className='max-w-3xl mx-auto'>
          <Accordion type='single' collapsible>
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </div>
  )
}

const testimonials = [
  {
    quote:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt.',
    name: 'Alex Johnson',
  },
  {
    quote:
      'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip.',
    name: 'Sam Rivera',
  },
  {
    quote:
      'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore.',
    name: 'Jordan Lee',
  },
  {
    quote:
      'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt.',
    name: 'Taylor Morgan',
  },
  {
    quote:
      'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque.',
    name: 'Casey Parker',
  },
]

const steps = [
  {
    title: 'Lorem Ipsum Dolor',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  },
  {
    title: 'Consectetur Adipiscing',
    description:
      'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  },
  {
    title: 'Sed Do Eiusmod',
    description:
      'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
  },
]

const faqs = [
  {
    question: 'Lorem ipsum dolor sit amet?',
    answer:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  },
  {
    question: 'Consectetur adipiscing elit sed do?',
    answer:
      'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  },
  {
    question: 'Duis aute irure dolor in reprehenderit?',
    answer:
      'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
  },
  {
    question: 'Excepteur sint occaecat cupidatat?',
    answer:
      'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
  },
  {
    question: 'Sed ut perspiciatis unde omnis?',
    answer:
      'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam.',
  },
]

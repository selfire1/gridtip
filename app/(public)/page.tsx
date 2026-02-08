'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowRight, Sparkles, Zap, Users } from 'lucide-react'

export default function Home() {
  return (
    <div className='space-y-32 py-16 md:space-y-40 md:py-20'>
      {/* Hero Section */}
      <section className='is-container'>
        <div className='grid gap-12 lg:grid-cols-2 lg:gap-16 items-center'>
          <div className='space-y-8'>
            <Badge className='w-fit' variant='outline'>
              <Sparkles className='w-3 h-3 mr-1.5' />
              New Features Available
            </Badge>
            <div className='space-y-6'>
              <h1 className='text-5xl font-bold tracking-tight lg:text-6xl xl:text-7xl bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent'>
                Lorem Ipsum Dolor Sit
              </h1>
              <p className='text-xl text-muted-foreground leading-relaxed'>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua.
              </p>
            </div>
            <div className='flex flex-wrap gap-4'>
              <Button size='lg' className='h-12 px-8 text-base group' asChild>
                <Link href='/auth'>
                  Get Started
                  <ArrowRight className='w-4 h-4 ml-2 transition-transform group-hover:translate-x-1' />
                </Link>
              </Button>
              <Button size='lg' variant='outline' className='h-12 px-8 text-base' asChild>
                <Link href='#'>Learn More</Link>
              </Button>
            </div>
          </div>
          <div className='bg-gradient-to-br from-primary/20 via-primary/10 to-background rounded-3xl aspect-video w-full shadow-2xl border border-border/50' />
        </div>
      </section>

      {/* Social Proof Section */}
      <section className='is-container'>
        <div className='text-center mb-12'>
          <h2 className='text-3xl font-bold mb-3'>Trusted by Thousands</h2>
          <p className='text-muted-foreground'>See what our users are saying</p>
        </div>
        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {testimonials.map((testimonial, index) => (
            <Card key={index} className='group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border/50'>
              <CardContent className='pt-6'>
                <div className='flex gap-1 mb-4'>
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className='w-4 h-4 bg-yellow-400 rounded-sm' />
                  ))}
                </div>
                <blockquote className='text-lg mb-6 leading-relaxed'>
                  "{testimonial.quote}"
                </blockquote>
                <div className='flex items-center gap-3'>
                  <Avatar className='w-12 h-12'>
                    <AvatarFallback className='bg-gradient-to-br from-primary/20 to-primary/10 text-sm font-semibold' />
                  </Avatar>
                  <div>
                    <div className='font-medium'>{testimonial.name}</div>
                    <div className='text-sm text-muted-foreground'>Customer</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className='is-container'>
        <div className='text-center mb-16'>
          <Badge className='mb-4' variant='outline'>
            Simple Process
          </Badge>
          <h2 className='text-4xl font-bold mb-4'>How It Works</h2>
          <p className='text-xl text-muted-foreground max-w-2xl mx-auto'>
            Get started in minutes with our streamlined workflow
          </p>
        </div>
        <div className='space-y-24'>
          {steps.map((step, index) => (
            <div
              key={index}
              className={`grid gap-12 lg:grid-cols-2 lg:gap-16 items-center ${
                index % 2 === 1 ? 'lg:flex-row-reverse' : ''
              }`}
            >
              <div
                className={`space-y-6 ${index % 2 === 1 ? 'lg:order-2' : ''}`}
              >
                <div className='flex items-center gap-4'>
                  <div className='flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-xl font-bold shadow-lg'>
                    {index + 1}
                  </div>
                  <Badge variant='secondary' className='text-xs'>
                    Step {index + 1}
                  </Badge>
                </div>
                <h3 className='text-3xl font-bold'>{step.title}</h3>
                <p className='text-lg text-muted-foreground leading-relaxed'>{step.description}</p>
                <div className='flex gap-2 pt-2'>
                  <div className='w-1 h-12 bg-gradient-to-b from-primary to-transparent rounded-full' />
                  <div className='space-y-3 pt-1'>
                    <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                      <Zap className='w-4 h-4 text-primary' />
                      Fast and efficient
                    </div>
                    <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                      <Users className='w-4 h-4 text-primary' />
                      Collaborative features
                    </div>
                  </div>
                </div>
              </div>
              <div
                className={`bg-gradient-to-br from-primary/20 via-primary/10 to-background rounded-3xl aspect-square w-full shadow-xl border border-border/50 ${
                  index % 2 === 1 ? 'lg:order-1' : ''
                }`}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Banner CTA Section */}
      <section className='relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-background border-y border-border/50'>
        <div className='absolute inset-0 bg-grid-pattern opacity-[0.02]' />
        <div className='is-container py-20 text-center space-y-8 relative'>
          <Badge className='mb-2'>Limited Time Offer</Badge>
          <h2 className='text-4xl lg:text-5xl font-bold max-w-3xl mx-auto leading-tight'>
            Ready to Get Started?
          </h2>
          <p className='text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed'>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
            eiusmod tempor incididunt ut labore.
          </p>
          <div className='flex flex-wrap gap-4 justify-center pt-4'>
            <Button size='lg' className='h-12 px-8 text-base shadow-lg group' asChild>
              <Link href='/auth'>
                Start Now
                <ArrowRight className='w-4 h-4 ml-2 transition-transform group-hover:translate-x-1' />
              </Link>
            </Button>
            <Button size='lg' variant='outline' className='h-12 px-8 text-base' asChild>
              <Link href='#'>Contact Sales</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section className='is-container'>
        <div className='text-center mb-12'>
          <Badge className='mb-4' variant='outline'>
            FAQ
          </Badge>
          <h2 className='text-4xl font-bold mb-4'>
            Frequently Asked Questions
          </h2>
          <p className='text-xl text-muted-foreground max-w-2xl mx-auto'>
            Find answers to common questions about our service
          </p>
        </div>
        <div className='max-w-3xl mx-auto'>
          <Accordion type='single' collapsible className='space-y-4'>
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className='border rounded-lg px-6 bg-card hover:shadow-md transition-shadow'
              >
                <AccordionTrigger className='text-left hover:no-underline py-5'>
                  <span className='font-semibold'>{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className='text-muted-foreground pb-5 leading-relaxed'>
                  {faq.answer}
                </AccordionContent>
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

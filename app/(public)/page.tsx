'use client'

import { Avatar, AvatarGroup } from '@ui/avatar'

import HeroOne from '@/public/img/hero-one.jpg'
import HeroTwo from '@/public/img/hero-two.jpg'

import Sarah from '@/public/people/sarah.png'
import Marcus from '@/public/people/marcus.png'
import Gina from '@/public/people/gina.png'
import Jake from '@/public/people/jake.png'

import SarahAvatar from '@/public/people/sarah-avatar.png'
import MarcusAvatar from '@/public/people/marcus-avatar.png'
import GinaAvatar from '@/public/people/gina-avatar.png'
import JakeAvatar from '@/public/people/jake-avatar.png'

import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Form,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import Image, { StaticImageData } from 'next/image'
import { cn } from '@/lib/utils'
import { SelectConstructor } from '@/components/select-constructor'
import { SelectDriver } from '@/components/select-driver'
import { DriverOptionProps } from '@/components/driver-option'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { LeaderBoard } from '../tipping/leaderboard/_components/leaderboard'
import { motion } from 'motion/react'
import { ChevronRight, LucideTrophy } from 'lucide-react'
import { getFormFields } from '@/lib/utils/tip-fields'
import { Path } from '@/lib/utils/path'
import { ConstructorProps } from '@/components/constructor'

const ANIMATION = {
  image: { y: 2, duration: 12 },
  ui: { y: 4, duration: 10 },
  avatar: { y: 6, duration: 6 },
  bubble: { y: 6, duration: 6 },
}

const groupTypes = [
  'friend group',
  'mates',
  'church',
  'school',
  'coworkers',
  'family',
  'community',
  'group chat',
  'pub mates',
]

function AnimatedGroupType() {
  const [index, setIndex] = useState(0)
  const [isFlipping, setIsFlipping] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setIsFlipping(true)
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % groupTypes.length)
        setIsFlipping(false)
      }, 300)
    }, 2500)

    return () => clearInterval(interval)
  }, [])

  return (
    <span
      className={`inline-block transition-all duration-300 font-black ${
        isFlipping
          ? 'opacity-0 -translate-y-2 scale-95'
          : 'opacity-100 translate-y-0 scale-100'
      }`}
    >
      {groupTypes[index]}
    </span>
  )
}

export default function Home() {
  return (
    <div className='space-y-32 py-16 md:space-y-40 md:py-20'>
      <Hero />
      <HowItWorks />

      {/* Banner CTA Section */}
      <section className='bg-primary/5 border-y'>
        <div className='is-container py-16 text-center space-y-6'>
          <h2 className='text-3xl font-bold lg:text-4xl'>
            Create a group for your <AnimatedGroupType />
          </h2>
          <p className='text-lg text-muted-foreground max-w-2xl mx-auto'>
            Become the star of your group by setting up a friendly tipping comp.
            It’s free!
          </p>
          <Button size='lg' asChild>
            <Link href={Path.SignUp}>
              Start Now
              <ChevronRight />
            </Link>
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
                <AccordionContent className='typography'>
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

const faqs = [
  {
    question: 'Do I need to pay for this?',
    answer: `Nope! GridTip is free for the 2026 season.`,
  },
  {
    question: 'What do I tip?',
    answer: (
      <>
        <p>
          For each race, points are up for grabs for Pole Position (the driver
          who qualifies P1), the positions P1, P10 and Last in the Grand Prix,
          and whichever constructor scores the most points that weekend. On
          sprint weekends, you can score a bonus point for Sprint P1.
        </p>
        <p>
          If you get in early, you can score bonus point for predicting the
          Drivers’ and Constructors’ Championships
        </p>
      </>
    ),
  },
  {
    question: 'How many points can I score?',
    answer: (
      <>
        <p>
          On a regular weekend, you can score five points (Pole, P1, P10, Last
          and constructor with most points). On sprint weekends, there is an
          extra point up for grabs.
        </p>
        <p>
          Correctly predicting the Constructors’s Championship gives you 10
          points, and the Driver’s 15 points.
        </p>
      </>
    ),
  },
  {
    question:
      'How can I earn extra bragging rights by proving my F1 tipping skills?',
    answer:
      'You can sign up to GridTip’s global group where you compete across groups. Claiming the crown will immortalise you in the GridTip hall of fame.',
  },
  {
    question: 'Are there prizes?',
    answer:
      'There are no predefined prizes. You can decide on them in your group. Some ideas: A champagne shower, shouting a dinner or taking the winner to a cart track!',
  },
  {
    question: 'Is there an app?',
    answer: (
      <>
        <p>
          For quick access, you can add the GridTip website to your homescreen.
          Have a look at the{' '}
          <Link href='https://support.apple.com/en-au/guide/iphone/iphea86e5236/ios'>
            instructions for iPhone
          </Link>{' '}
          or for{' '}
          <Link href='https://support.google.com/chrome/answer/15085120'>
            Android
          </Link>
          .
        </p>
      </>
    ),
  },
  {
    question: 'Who built this?',
    answer:
      'Hi! 🙋‍♂️ I’m Joschua. I started GridTip as a friendly competition among my friends, and I’m hoping it can infuse your friend group with the same lively discussions at it did mine.',
  },
]

function Hero() {
  const textAnimation = (delay: number) => ({
    initial: {
      opacity: 0,
      filter: 'blur(5px)',
      x: 8,
    },
    animate: { opacity: 1, filter: 'blur(0px)', x: 0 },
    transition: {
      duration: 0.7,
      ease: 'easeOut' as const,
      delay,
    },
  })
  return (
    <section className='is-container'>
      <div className='grid gap-12 md:grid-cols-2 md:gap-16 items-center'>
        <div className='flex flex-col gap-6 items-center md:items-start text-center md:text-left'>
          <motion.h1
            className='text-4xl font-bold tracking-tight lg:text-5xl xl:text-6xl text-pretty'
            {...textAnimation(0)}
          >
            The F1 season is better with your friends
          </motion.h1>
          <motion.div
            className='text-lg text-muted-foreground space-y-2'
            {...textAnimation(0.05)}
          >
            <p>What makes the sport you love even better? Your friends!</p>
            <p>
              GridTip is a social tipping competition which infuses the season
              with fun and rivalries. So start a group, make your predictions
              and see how you compare!
            </p>
          </motion.div>
          <div className='flex gap-4'>
            <motion.div {...textAnimation(0.1)}>
              <Button size='lg' asChild>
                <Link href={Path.SignUp}>Get Started</Link>
              </Button>
            </motion.div>
            <motion.div {...textAnimation(0.15)}>
              <Button size='lg' variant='outline' asChild>
                <Link href='#how-it-works'>Learn More</Link>
              </Button>
            </motion.div>
          </div>
        </div>
        <HeroImage />
      </div>
    </section>
  )
}

const showcaseSchema = z.object({
  constructorWithMostPoints: z
    .object({
      id: z.string(),
    })
    .optional(),
  pole: z
    .object({
      id: z.string(),
    })
    .optional(),
})

type ShowcaseSchema = z.infer<typeof showcaseSchema>

function HeroImage() {
  const animationElevationOne = (delay: number) => ({
    initial: {
      opacity: 0,
      y: ANIMATION.image.y * -1,
    },
    animate: {
      opacity: 1,
      y: [ANIMATION.image.y * -1, ANIMATION.image.y],
    },
    transition: {
      opacity: {
        delay: 2 + delay,
        duration: 0.7,
      },
      y: {
        delay: 0.3 + delay,
        duration: ANIMATION.image.duration + delay,
        repeatType: 'reverse' as const,
        repeat: Infinity,
        ease: 'easeInOut' as const,
      },
    },
  })

  const animationElevationTwo = (index: number) => ({
    initial: {
      opacity: 0,
      scale: 0.5,
      y: ANIMATION.ui.y * -1,
    },
    animate: {
      opacity: 1,
      scale: 1,
      y: [ANIMATION.ui.y * -1, ANIMATION.image.y],
    },
    transition: {
      opacity: {
        delay: (index + 1) * 0.1 + 1,
        duration: 0.2,
        ease: 'easeOut' as const,
      },
      scale: {
        delay: (index + 1) * 0.1 + 1,
        duration: 0.2,
        ease: 'easeOut' as const,
      },
      y: {
        delay: (index + 1) * 0.1 + 1 + 0.2,
        duration: ANIMATION.ui.duration + (index + 1) * 0.2,
        repeatType: 'reverse' as const,
        repeat: Infinity,
        ease: 'easeInOut' as const,
      },
    },
  })

  const elevation = {
    one: 'z-[10] shadow',
    two: 'z-[20] shadow-md opacity-90',
  }
  const imageClasses =
    'opacity-85 h-full w-full object-cover brightness-90 dark:brightness-50'

  const imageWrapperClasses = cn(
    'absolute rounded overflow-hidden aspect-[2/3] h-[20rem] w-auto bg-muted',
    elevation.one,
  )
  return (
    <div className='isolate w-full h-full aspect-[2/5] sm:aspect-square md:aspect-[2/3] lg:aspect-video relative'>
      <motion.div
        className={cn(imageWrapperClasses, 'top-0 left-0 rotate-3')}
        {...animationElevationOne(0.1)}
      >
        <Image
          src={HeroOne}
          sizes='100vw, (max-width: 640px) 50vw, (max-width: 768px) 400px, (max-width: 1024px) 920px'
          quality={80}
          priority={true}
          placeholder='blur'
          loading='eager'
          alt='sparks flying of a race car'
          className={cn(imageClasses, 'origin-left')}
        />
      </motion.div>
      <motion.div
        className={cn(
          'absolute backdrop-blur bg-background/80 p-4 border rounded rotate-2 w-48',
          'right-[2%] top-[22%]',
          'sm:left-[70%] sm:top-[10%]',
          'md:left-[50%] sm:top-[1%]',
          'lg:left-[-2%] lg:top-[47%]',
          elevation.two,
        )}
        {...animationElevationTwo(0)}
      >
        <DummyConstructorForm
          label='Constructor with Most Points'
          defaultValue='ferrari'
        />
      </motion.div>
      <motion.div
        className={cn(
          'absolute backdrop-blur bg-background/80 p-4 border rounded -rotate-1 w-48',
          'top-[90%] right-[4%]',
          'sm:left-[28%] sm:top-[55%]',
          'md:hidden',
          'lg:block lg:left-[30%] lg:top-[5%]',
          elevation.two,
        )}
        {...animationElevationTwo(1)}
      >
        <DummyDriverForm defaultValue='verstappen' label='Pole Position' />
      </motion.div>
      <motion.div
        {...animationElevationTwo(2)}
        className={cn(
          'hidden sm:block absolute backdrop-blur bg-background/80 p-4 border rounded -rotate-1 w-48',
          elevation.two,
          'z-[21]',
          'sm:right-[4%] sm:top-[90%]',
          'md:right-[1%] md:top-[90%]',
        )}
      >
        <DummyDriverForm defaultValue='piastri' label='P1' />
      </motion.div>
      <motion.div
        {...animationElevationTwo(2)}
        className={cn(
          'absolute  bg-background/80 p-4 border rounded -rotate-6 w-90 backdrop-blur',
          'hidden',
          'sm:block sm:left-[2%] sm:top-[80%]',
          'md:hidden md:left-[2%] md:top-[65%]',
          'lg:block lg:left-[4%] lg:top-[100%]',
          elevation.two,
        )}
      >
        <LeaderBoard
          leaderboard={[
            {
              place: 1,
              delta: 3,
              points: 10,
              pointsDelta: 4,
              member: {
                id: '1',
                userName: 'Marcus',
                profileImage: null,
              },
            },
          ]}
        />
      </motion.div>
      <ChatAvatar
        index={0}
        offset={65}
        src={Sarah}
        alt='Asian-Australian woman with shoulder-length black hair, wearing stylish glasses, with a professional but casual style'
        className={{
          root: cn(
            'shadow-none absolute',
            'right-[2%] top-[54%]',
            'sm:right-[4%] sm:top-[70%]',
            'md:right-[1%] md:top-[60%]',
          ),
          bubble: 'rotate-1',
        }}
        text='manifesting an Oscar win'
      />
      <ChatAvatar
        index={1}
        className={{
          root: cn(
            'shadow-none absolute',
            'top-[70%] left-[2%]',
            'sm:left-[5%] sm:top-[45%]',
            'md:left-[5%] md:top-[45%]',
            'lg:left-[65%] lg:top-[5%]',
          ),
          bubble: '-rotate-2 -mb-4 -mr-8 md:hidden lg:block',
        }}
        offset={15}
        src={Marcus}
        alt='Man with beard wearing a Red Bull Racing cap with hearts floating before him'
        text={'max’s qualy…\n simply lovely!'}
      />
      <ChatAvatar
        index={2}
        className={{
          root: cn(
            'shadow-none absolute ',
            'top-2 right-0 ',
            'sm:right-[40%] sm:top-[5%]',
            'md:right-[80%] md:top-[2%]',
          ),
          image: cn('rotate-3'),
          bubble: 'rotate-3 -mb-4 mr-8',
        }}
        offset={65}
        src={Gina}
        alt='Young woman with blonde hair, surprised'
        text='insane first turn!'
      />
      <ChatAvatar
        index={3}
        className={{
          root: cn(
            'left-0 top-[34%] absolute',
            'sm:left-[75%] sm:top-[25%]',
            'md:left-[40%] sm:top-[17%]',
            'lg:left-[-10%] lg:top-[70%]',
          ),
          image: cn('rotate-4'),
          bubble: '-rotate-3 -mb-4 mr-8 lg:mr-0',
        }}
        offset={65}
        src={Jake}
        alt='Young man with curly brown hair, stubble, looking skeptical'
        text='sketchy tips this round…'
      />
      <motion.div
        {...animationElevationOne(0.2)}
        className={cn(
          imageWrapperClasses,
          'bottom-0 right-0 -rotate-3',
          'lg:top-[30%]',
        )}
      >
        <Image
          src={HeroTwo}
          sizes='100vw, (max-width: 640px) 50vw, (max-width: 768px) 400px, (max-width: 1024px) 920px'
          quality={80}
          className={imageClasses}
          priority={true}
          placeholder='blur'
          loading='eager'
          alt='shillhouette of a driver against the sunlight'
        />
      </motion.div>
    </div>
  )
}

function DummyConstructorForm({
  label,
  description,
  defaultValue,
}: {
  label: string
  description?: string
  defaultValue?: string
}) {
  const form = useForm<ShowcaseSchema>({
    resolver: zodResolver(showcaseSchema),
    defaultValues: {
      constructorWithMostPoints: {
        id: defaultValue,
      },
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={(e) => e.preventDefault()}>
        <FormField
          control={form.control}
          name='constructorWithMostPoints'
          render={({ field }) => (
            <FormItem>
              <FormLabel>{label}</FormLabel>
              <SelectConstructor
                value={field.value}
                onSelect={(constructor) =>
                  form.setValue('constructorWithMostPoints', constructor, {
                    shouldDirty: true,
                  })
                }
                constructors={getHardcodedConstructors()}
              />
              <FormDescription>{description}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}

function DummyDriverForm({
  defaultValue,
  label,
  description,
}: {
  defaultValue?: ReturnType<typeof getHardcodedDrivers>[number]['id']
  label: string
  description?: string
}) {
  const form = useForm<ShowcaseSchema>({
    resolver: zodResolver(showcaseSchema),
    defaultValues: {
      pole: {
        id: defaultValue,
      },
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={(e) => e.preventDefault()}>
        <FormField
          control={form.control}
          name='pole'
          render={({ field }) => (
            <FormItem>
              <FormLabel>{label}</FormLabel>
              <SelectDriver
                value={field.value}
                onSelect={(driver) => {
                  if (!driver) return
                  form.setValue('pole', driver, {
                    shouldDirty: true,
                  })
                }}
                drivers={getHardcodedDrivers()}
              />
              <FormDescription>{description}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}

function getHardcodedConstructors() {
  return [
    {
      id: 'alpine',
      name: 'Alpine F1 Team',
    },
    {
      id: 'aston_martin',
      name: 'Aston Martin',
    },
    {
      id: 'audi',
      name: 'Audi',
    },
    {
      id: 'cadillac',
      name: 'Cadillac F1 Team',
    },
    {
      id: 'ferrari',
      name: 'Ferrari',
    },
    {
      id: 'haas',
      name: 'Haas F1 Team',
    },
    {
      id: 'mclaren',
      name: 'McLaren',
    },
    {
      id: 'mercedes',
      name: 'Mercedes',
    },
    {
      id: 'rb',
      name: 'RB F1 Team',
    },
    {
      id: 'red_bull',
      name: 'Red Bull',
    },
    {
      id: 'williams',
      name: 'Williams',
    },
  ] satisfies ConstructorProps[]
}

function getHardcodedDrivers(): DriverOptionProps[] {
  return [
    {
      id: 'albon',
      constructorId: 'williams',
      givenName: 'Alexander',
      familyName: 'Albon',
    },
    {
      id: 'alonso',
      constructorId: 'aston_martin',
      givenName: 'Fernando',
      familyName: 'Alonso',
    },
    {
      id: 'antonelli',
      constructorId: 'mercedes',
      givenName: 'Andrea Kimi',
      familyName: 'Antonelli',
    },
    {
      id: 'bearman',
      constructorId: 'haas',
      givenName: 'Oliver',
      familyName: 'Bearman',
    },
    {
      id: 'bortoleto',
      constructorId: 'audi',
      givenName: 'Gabriel',
      familyName: 'Bortoleto',
    },
    {
      id: 'bottas',
      constructorId: 'cadillac',
      givenName: 'Valtteri',
      familyName: 'Bottas',
    },
    {
      id: 'colapinto',
      constructorId: 'alpine',
      givenName: 'Franco',
      familyName: 'Colapinto',
    },
    {
      id: 'gasly',
      constructorId: 'alpine',
      givenName: 'Pierre',
      familyName: 'Gasly',
    },
    {
      id: 'hadjar',
      constructorId: 'red_bull',
      givenName: 'Isack',
      familyName: 'Hadjar',
    },
    {
      id: 'hamilton',
      constructorId: 'ferrari',
      givenName: 'Lewis',
      familyName: 'Hamilton',
    },
    {
      id: 'hulkenberg',
      constructorId: 'audi',
      givenName: 'Nico',
      familyName: 'Hülkenberg',
    },
    {
      id: 'lawson',
      constructorId: 'rb',
      givenName: 'Liam',
      familyName: 'Lawson',
    },
    {
      id: 'leclerc',
      constructorId: 'ferrari',
      givenName: 'Charles',
      familyName: 'Leclerc',
    },
    {
      id: 'lindblad',
      constructorId: 'rb',
      givenName: 'Arvid',
      familyName: 'Lindblad',
    },
    {
      id: 'norris',
      constructorId: 'mclaren',
      givenName: 'Lando',
      familyName: 'Norris',
    },
    {
      id: 'ocon',
      constructorId: 'haas',
      givenName: 'Esteban',
      familyName: 'Ocon',
    },
    {
      id: 'piastri',
      constructorId: 'mclaren',
      givenName: 'Oscar',
      familyName: 'Piastri',
    },
    {
      id: 'perez',
      constructorId: 'cadillac',
      givenName: 'Sergio',
      familyName: 'Pérez',
    },
    {
      id: 'russell',
      constructorId: 'mercedes',
      givenName: 'George',
      familyName: 'Russell',
    },
    {
      id: 'sainz',
      constructorId: 'williams',
      givenName: 'Carlos',
      familyName: 'Sainz',
    },
    {
      id: 'stroll',
      constructorId: 'aston_martin',
      givenName: 'Lance',
      familyName: 'Stroll',
    },
    {
      id: 'max_verstappen',
      constructorId: 'red_bull',
      givenName: 'Max',
      familyName: 'Verstappen',
    },
  ] as const
}

function SpeechBubble({
  text,
  offset,
  className,
  delay,
}: {
  text: string
  offset: number
  delay: number
  className?: string
}) {
  const bubbleAnimation = {
    initial: {
      opacity: 0,
      scale: 0.5,
      y: [ANIMATION.bubble.y * -1, ANIMATION.bubble.y],
    },
    animate: { opacity: 1, scale: 1, y: 0 },
    transition: {
      opacity: { delay: delay + 0.2, duration: 0.1, ease: 'easeOut' as const },
      scale: { delay: delay + 0.2, duration: 0.1, ease: 'easeOut' as const },
      y: {
        delay: delay + 0.2,
        duration: ANIMATION.bubble.duration + delay,
        repeatType: 'reverse' as const,
        repeat: Infinity,
        ease: 'easeInOut' as const,
      },
    },
  }

  return (
    <motion.div
      className={cn(className, 'relative z-[40]')}
      {...bubbleAnimation}
    >
      <div
        style={{ '--offset': `${offset}%` } as React.CSSProperties}
        className={cn(
          'rounded-md px-3 py-2 bg-gradient-to-b from-background/90 to-blue-50/90 font-medium text-foreground/90 relative backdrop-blur-md overflow-hidden',
        )}
      >
        <div className='space-y-1'>
          {text.split('\n').map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </div>
      <div
        className='speech-bubble-tail bg-blue-50/90 backdrop-blur-md'
        style={{ '--offset': `${offset}%` } as React.CSSProperties}
      />
    </motion.div>
  )
}

function ChatAvatar({
  className,
  text,
  src,
  offset,
  index,
}: {
  className?: {
    root?: string
    image?: string
    bubble?: string
  }
  index: number
  src: StaticImageData
  alt: string
  text: string
  offset: number
}) {
  const delay = (index + 1) * 0.2 + 0.2
  const avatarAnimation = {
    initial: {
      opacity: 0,
      scale: 0.5,
      rotate: 20,
      y: ANIMATION.avatar.y * -1,
    },
    animate: {
      opacity: 1,
      scale: 1,
      rotate: 0,
      y: [ANIMATION.avatar.y * -1, ANIMATION.avatar.y],
    },
    transition: {
      y: {
        delay: delay + 0.2,
        duration: ANIMATION.avatar.duration + delay,
        repeatType: 'reverse' as const,
        repeat: Infinity,
        ease: 'easeInOut' as const,
      },

      opacity: {
        delay,
        duration: 0.1,
        ease: 'easeOut' as const,
      },
      scale: {
        delay,
        duration: 0.1,
        ease: 'easeOut' as const,
      },
      rotate: {
        delay,
        duration: 0.1,
        ease: 'easeOut' as const,
      },
    },
  }

  return (
    <div className={cn(className?.root)}>
      <div className='relative flex flex-col items-center'>
        <SpeechBubble
          className={cn('-mb-4', className?.bubble, 'z-[50]')}
          offset={offset}
          text={text}
          delay={delay}
        />
        <motion.div
          {...avatarAnimation}
          className={cn(
            'rounded-full overflow-hidden aspect-square size-[8rem] relative z-[30]',
            className?.image,
          )}
        >
          <Image
            height={150}
            width={150}
            src={src}
            className='scale-[101%] w-full h-full'
            sizes='100vw, (max-width: 640px) 50vw, (max-width: 768px) 400px, (max-width: 1024px) 920px'
            quality={80}
            priority={true}
            placeholder='blur'
            loading='eager'
            alt='todo'
          />
        </motion.div>
      </div>
    </div>
  )
}

function HowItWorks() {
  return (
    <section className='is-container'>
      <h2 className='text-3xl font-bold text-center mb-12' id='how-it-works'>
        How It Works
      </h2>
      <div className='space-y-16'>
        <Step
          overline='Step 1'
          title='Claim a group for your friends'
          description='Create a platform where you and your friends can make predictions. Setting one up is faster than a Ferrari pit stop.'
        >
          <div className='bg-background p-6 border rounded-md space-y-2 absolute top-[10%] left-[10%] -right-12'>
            <div className='space-y-1'>
              <LucideTrophy className='p-2 size-8 bg-muted rounded-lg' />
              <p className='text-xl sm:text-2xl font-semibold tracking-tight'>
                The Troublemakers
              </p>
            </div>
            <AvatarGroup>
              <Avatar size='lg'>
                <div className='rounded-full overflow-hidden size-10'>
                  <Image
                    height={100}
                    width={100}
                    className='scale-[105%] h-full w-full object-cover'
                    src={SarahAvatar}
                    alt='example avatar of sarah'
                  />
                </div>
              </Avatar>
              <Avatar size='lg'>
                <div className='rounded-full overflow-hidden size-10'>
                  <Image
                    height={100}
                    width={100}
                    className='scale-[105%] h-full w-full object-cover'
                    src={JakeAvatar}
                    alt='example avatar of jake'
                  />
                </div>
              </Avatar>
              <Avatar size='lg'>
                <div className='rounded-full overflow-hidden size-10'>
                  <Image
                    height={100}
                    width={100}
                    className='scale-[105%] h-full w-full object-cover'
                    src={GinaAvatar}
                    alt='example avatar of gina'
                  />
                </div>
              </Avatar>
              <Avatar size='lg'>
                <div className='rounded-full overflow-hidden size-10'>
                  <Image
                    height={100}
                    width={100}
                    className='scale-[105%] h-full w-full object-cover'
                    src={MarcusAvatar}
                    alt='example avatar of marcus'
                  />
                </div>
              </Avatar>
            </AvatarGroup>
          </div>
        </Step>
        <Step
          overline='Step 2'
          title='Pick your tips'
          isSwap
          description='Predict key results for each race. Did Max clinch pole? Will a rookie upset the order? And can Stroll be counted on to finish at the back? Seeing how your tips turn out makes every race more exciting.'
        >
          <DummyTips />
        </Step>
        <Step
          overline='Step 3'
          title='Climb the leaderboard'
          description='Gather points throughout the weekend. That friend who reckons they’re an F1 expert? Let the results speak for themselves.'
        >
          <div className='bg-background p-6 border rounded-md space-y-2 absolute top-[10%] left-[10%] -right-12'>
            <LeaderBoard
              leaderboard={[
                {
                  place: 1,
                  delta: 2,
                  points: 10,
                  pointsDelta: 4,
                  member: {
                    id: '1',
                    userName: 'You?',
                    profileImage: '/people/you.webp',
                  },
                },
                {
                  place: 2,
                  delta: -1,
                  points: 8,
                  pointsDelta: 0,
                  member: {
                    id: '2',
                    userName: 'Marcus',
                    profileImage: '/people/marcus-avatar.webp',
                  },
                },
                {
                  place: 3,
                  delta: 1,
                  points: 7,
                  pointsDelta: 1,
                  member: {
                    id: '3',
                    userName: 'Gina',
                    profileImage: '/people/gina-avatar.webp',
                  },
                },
                {
                  place: 3,
                  delta: 1,
                  points: 6,
                  pointsDelta: 1,
                  member: {
                    id: '4',
                    userName: 'Sarah',
                    profileImage: '/people/sarah-avatar.webp',
                  },
                },
                {
                  place: 4,
                  delta: -2,
                  points: 4,
                  pointsDelta: 0,
                  member: {
                    id: '5',
                    userName: 'Jake',
                    profileImage: '/people/jake-avatar.webp',
                  },
                },
              ]}
            />
          </div>
        </Step>
      </div>
    </section>
  )

  function Step({
    isSwap = false,
    overline,
    title,
    description,
    children,
  }: {
    isSwap?: boolean
    overline: string
    title: string
    description: string
    children?: React.ReactNode
  }) {
    return (
      <div
        className={`grid gap-8 lg:grid-cols-2 lg:gap-16 items-center ${
          isSwap ? 'lg:flex-row-reverse' : ''
        }`}
      >
        <div className={`space-y-4 ${isSwap ? 'lg:order-2' : ''}`}>
          <div className='text-sm font-semibold text-primary'>{overline}</div>
          <h3 className='text-2xl font-bold'>{title}</h3>
          <p className='text-muted-foreground'>{description}</p>
        </div>
        <div
          className={`relative border overflow-hidden bg-muted rounded-md aspect-[3/2] w-full ${
            isSwap ? 'lg:order-1' : ''
          }`}
        >
          {children}
        </div>
      </div>
    )
  }
}

function DummyTips() {
  return (
    <div className='bg-background p-6 border rounded-md space-y-2 absolute top-[10%] left-[10%] -right-12'>
      {getFormFields().map((field, index) => {
        const isDriver = field.type === 'driver'
        if (isDriver) {
          return (
            <DummyDriverForm
              key={index}
              label={field.label}
              description={field.description}
            />
          )
        }
        return (
          <DummyConstructorForm
            key={index}
            label={field.label}
            description={field.description}
          />
        )
      })}
    </div>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Hook to animate number value changes
 */
function useAnimatedValue(targetValue: number, duration: number = 1000) {
  const [displayValue, setDisplayValue] = useState(targetValue)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    // Cancel any ongoing animation
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
    }

    const startValue = displayValue
    const startTime = Date.now()

    const animate = () => {
      const currentTime = Date.now()
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing function (ease-out cubic)
      const eased = 1 - Math.pow(1 - progress, 3)
      const nextValue = Math.round(startValue + (targetValue - startValue) * eased)

      setDisplayValue(nextValue)

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        rafRef.current = null
      }
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [targetValue, duration, displayValue])

  return displayValue
}

/**
 * @see https://github.com/papermark/gauge-demo/blob/main/app/gauge.tsx
 */
export const Gauge = ({
  value,
  size = 'small',
  showValue = true,
  color = 'text-primary',
  bgcolor = 'text-primary/20',
}: {
  value: number
  size?: 'small' | 'medium' | 'large'
  showValue?: boolean
  color?: string
  bgcolor?: string
}) => {
  const animatedValue = useAnimatedValue(value, 1000)
  const circumference = 327 //2 * Math.PI * 52; // 2 * pi * radius
  const valueInCircumference = (value / 100) * circumference
  const strokeDasharray = `${circumference} ${circumference}`
  const initialOffset = circumference
  const strokeDashoffset = initialOffset - valueInCircumference

  const sizes = {
    small: {
      width: '24',
      height: '24',
      textSize: 'text-xs',
    },
    medium: {
      width: '72',
      height: '72',
      textSize: 'text-lg',
    },
    large: {
      width: '144',
      height: '144',
      textSize: 'text-3xl',
    },
  }

  return (
    <div className='flex flex-col items-center justify-center relative'>
      <svg
        fill='none'
        shapeRendering='crispEdges'
        height={sizes[size].height}
        width={sizes[size].width}
        viewBox='0 0 120 120'
        strokeWidth='2'
        className='transform -rotate-90'
      >
        <circle
          className={`${bgcolor}`}
          strokeWidth='16'
          stroke='currentColor'
          fill='transparent'
          shapeRendering='geometricPrecision'
          r='52'
          cx='60'
          cy='60'
        />
        <circle
          className={`animate-gauge_fill ${color}`}
          strokeWidth='16'
          strokeDasharray={strokeDasharray}
          strokeDashoffset={initialOffset}
          shapeRendering='geometricPrecision'
          strokeLinecap='round'
          stroke='currentColor'
          fill='transparent'
          r='52'
          cx='60'
          cy='60'
          style={{
            strokeDashoffset: strokeDashoffset,
            transition: 'stroke-dashoffset 1s cubic-bezier(0.33, 1, 0.68, 1) 0s',
          }}
        />
      </svg>
      {showValue ? (
        <div className='absolute flex opacity-0 animate-gauge_fadeIn'>
          <p className={`text-gray-100 ${sizes[size].textSize}`}>{animatedValue}</p>
        </div>
      ) : null}
    </div>
  )
}

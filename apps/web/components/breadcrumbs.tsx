'use client'

import { nav } from '@/components/nav-main'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { usePathname } from 'next/navigation'
import React from 'react'

export default function Breadcrumbs() {
  const pathname = usePathname()
  const parts = pathname.split('/').filter(Boolean)
  const hrefToTitleMap = nav.reduce((acc, item) => {
    item.items?.forEach((subItem) => {
      acc.set(subItem.url, subItem.title)
    })
    return acc
  }, new Map<string, string>())

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          {parts.map((part, index, parts) => {
            const length = parts.length
            const isLast = index === length - 1
            const href = `/${parts.slice(0, index + 1).join('/')}`
            const label = hrefToTitleMap.get(href) || sentenceCase(part)
            if (isLast) {
              return (
                <BreadcrumbItem key={href}>
                  <BreadcrumbPage>{label}</BreadcrumbPage>
                </BreadcrumbItem>
              )
            }
            return (
              <React.Fragment key={href}>
                <BreadcrumbItem className='hidden md:block'>
                  <BreadcrumbLink href={href}>{label}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className='hidden md:block' />
              </React.Fragment>
            )
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </>
  )
  function sentenceCase(str: string) {
    return str
      .split(/[-_]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }
}

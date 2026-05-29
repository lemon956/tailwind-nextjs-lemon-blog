'use client'

import { type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { getAdPlacementForPathname, getManualAdSlots } from '../../lib/adsConfig'
import AdSenseUnit from './AdSenseUnit'

const sideAdClass =
  'h-[clamp(280px,42vh,600px)] w-full max-w-[8rem] overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950'

const bottomAdClass =
  'min-h-[90px] w-full max-w-3xl overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950'

export default function PageAds({ children }: { children: ReactNode }) {
  const pathname = usePathname() || '/'
  const placement = getAdPlacementForPathname(pathname)
  const slots = getManualAdSlots()

  if (!placement) {
    return <>{children}</>
  }

  if (placement === 'bottom') {
    return (
      <>
        {children}
        <div className="mx-auto mt-10 mb-4 flex w-full max-w-3xl justify-center px-4 sm:px-6 xl:px-0">
          <AdSenseUnit className={bottomAdClass} placement="bottom" slot={slots.bottom} />
        </div>
      </>
    )
  }

  return (
    <div className="relative">
      {children}
      <aside
        aria-label="Advertisement"
        className="fixed top-28 left-[calc((100vw-64rem)/2-9rem)] z-10 hidden w-32 max-w-[8rem] 2xl:block"
      >
        <AdSenseUnit className={sideAdClass} placement="side" slot={slots.side} />
      </aside>
      <aside
        aria-label="Advertisement"
        className="fixed top-28 right-[calc((100vw-64rem)/2-9rem)] z-10 hidden w-32 max-w-[8rem] 2xl:block"
      >
        <AdSenseUnit className={sideAdClass} placement="side" slot={slots.side} />
      </aside>
    </div>
  )
}

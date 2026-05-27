'use client'

import { useEffect, useRef } from 'react'
import { GOOGLE_ADSENSE_CLIENT_ID, type AdPlacement } from '../../lib/adsConfig'

declare global {
  interface Window {
    adsbygoogle?: unknown[]
  }
}

type AdSenseUnitProps = {
  className?: string
  placement: AdPlacement
  slot?: string
}

export default function AdSenseUnit({ className = '', placement, slot }: AdSenseUnitProps) {
  const hasPushedAd = useRef(false)

  useEffect(() => {
    if (!slot || hasPushedAd.current) return

    try {
      window.adsbygoogle = window.adsbygoogle || []
      window.adsbygoogle.push({})
      hasPushedAd.current = true
    } catch {
      // Ad blockers can prevent the AdSense runtime from initializing.
    }
  }, [slot])

  if (!slot) {
    if (process.env.NODE_ENV === 'production') return null

    return (
      <div
        aria-hidden="true"
        className={`flex items-center justify-center border border-dashed border-gray-300 bg-gray-100 text-xs font-medium text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 ${className}`}
      >
        AdSense {placement} slot
      </div>
    )
  }

  return (
    <ins
      className={`adsbygoogle ${className}`}
      style={{ display: 'block' }}
      data-ad-client={GOOGLE_ADSENSE_CLIENT_ID}
      data-ad-format="auto"
      data-ad-slot={slot}
      data-full-width-responsive={placement === 'bottom' ? 'true' : 'false'}
    />
  )
}

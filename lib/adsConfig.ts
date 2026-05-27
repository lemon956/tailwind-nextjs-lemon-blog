export const GOOGLE_ADSENSE_CLIENT_ID = 'ca-pub-2297597965492195'

export type AdPlacement = 'bottom' | 'side'

export type ManualAdSlots = {
  bottom?: string
  side?: string
}

type AdsenseEnv = Partial<{
  NEXT_PUBLIC_GOOGLE_ADSENSE_BOTTOM_SLOT: string
  NEXT_PUBLIC_GOOGLE_ADSENSE_SIDE_SLOT: string
}>

export function isToolsRoute(pathname: string) {
  return pathname === '/tools' || pathname.startsWith('/tools/')
}

export function getAdPlacementForPathname(pathname: string): AdPlacement {
  return isToolsRoute(pathname) ? 'bottom' : 'side'
}

export function getGoogleAdsenseScriptProps() {
  return {
    async: true,
    crossOrigin: 'anonymous',
    src: `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${GOOGLE_ADSENSE_CLIENT_ID}`,
  } as const
}

export function getManualAdSlots(
  env: AdsenseEnv = {
    NEXT_PUBLIC_GOOGLE_ADSENSE_BOTTOM_SLOT: process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_BOTTOM_SLOT,
    NEXT_PUBLIC_GOOGLE_ADSENSE_SIDE_SLOT: process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_SIDE_SLOT,
  }
): ManualAdSlots {
  const bottom = env.NEXT_PUBLIC_GOOGLE_ADSENSE_BOTTOM_SLOT?.trim() || undefined
  const side = env.NEXT_PUBLIC_GOOGLE_ADSENSE_SIDE_SLOT?.trim() || undefined

  return { bottom, side }
}

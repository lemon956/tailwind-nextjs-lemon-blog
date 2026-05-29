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

function normalizePathname(pathname: string) {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1)
  }

  return pathname
}

export function isToolDetailRoute(pathname: string) {
  const normalizedPathname = normalizePathname(pathname)

  return normalizedPathname.startsWith('/tools/') && normalizedPathname !== '/tools'
}

export function isArticleRoute(pathname: string) {
  const normalizedPathname = normalizePathname(pathname)

  return (
    normalizedPathname.startsWith('/blog/') &&
    normalizedPathname !== '/blog' &&
    !normalizedPathname.startsWith('/blog/page/')
  )
}

export function getAdPlacementForPathname(pathname: string): AdPlacement | null {
  if (isToolDetailRoute(pathname)) return 'bottom'
  if (isArticleRoute(pathname)) return 'side'

  return null
}

export function getGoogleAdsenseScriptProps() {
  return {
    async: true,
    crossOrigin: 'anonymous',
    src: `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${GOOGLE_ADSENSE_CLIENT_ID}`,
  } as const
}

export function getGoogleAdsenseAccountMeta() {
  return {
    name: 'google-adsense-account',
    content: GOOGLE_ADSENSE_CLIENT_ID,
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

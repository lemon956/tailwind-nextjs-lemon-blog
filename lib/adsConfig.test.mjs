import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

async function loadAdsConfig() {
  try {
    return await import('./adsConfig.ts')
  } catch {
    return {}
  }
}

test('isToolsRoute matches the tools index and nested tool pages only', async () => {
  const { isToolsRoute = () => false } = await loadAdsConfig()

  assert.equal(isToolsRoute('/tools'), true)
  assert.equal(isToolsRoute('/tools/'), true)
  assert.equal(isToolsRoute('/tools/json-formatter'), true)
  assert.equal(isToolsRoute('/tools/sql-formatter'), true)

  assert.equal(isToolsRoute('/'), false)
  assert.equal(isToolsRoute('/blog'), false)
  assert.equal(isToolsRoute('/toolbox'), false)
  assert.equal(isToolsRoute('/toolshed'), false)
})

test('getAdPlacementForPathname uses bottom ads for tools pages and side ads elsewhere', async () => {
  const { getAdPlacementForPathname = () => undefined } = await loadAdsConfig()

  assert.equal(getAdPlacementForPathname('/'), null)
  assert.equal(getAdPlacementForPathname('/blog'), null)
  assert.equal(getAdPlacementForPathname('/tags'), null)
  assert.equal(getAdPlacementForPathname('/about'), null)
  assert.equal(getAdPlacementForPathname('/privacy'), null)
  assert.equal(getAdPlacementForPathname('/contact'), null)
  assert.equal(getAdPlacementForPathname('/tools'), null)
  assert.equal(getAdPlacementForPathname('/tools/'), null)
  assert.equal(getAdPlacementForPathname('/blog/page/1'), null)
  assert.equal(getAdPlacementForPathname('/tools/json-formatter'), 'bottom')
  assert.equal(getAdPlacementForPathname('/tools/sql-formatter'), 'bottom')
  assert.equal(getAdPlacementForPathname('/blog/example-post'), 'side')
  assert.equal(getAdPlacementForPathname('/blog/obsidian/example-post'), 'side')
})

test('getGoogleAdsenseScriptProps matches the AdSense snippet supplied by Google', async () => {
  const { getGoogleAdsenseScriptProps = () => ({}) } = await loadAdsConfig()

  assert.deepEqual(getGoogleAdsenseScriptProps(), {
    async: true,
    crossOrigin: 'anonymous',
    src: 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2297597965492195',
  })
})

test('getGoogleAdsenseAccountMeta returns the publisher account verification meta', async () => {
  const { getGoogleAdsenseAccountMeta = () => ({}) } = await loadAdsConfig()

  assert.deepEqual(getGoogleAdsenseAccountMeta(), {
    name: 'google-adsense-account',
    content: 'ca-pub-2297597965492195',
  })
})

test('root layout places the AdSense script before body for site verification', () => {
  const layout = fs.readFileSync('app/layout.tsx', 'utf8')
  const scriptIndex = layout.indexOf('<script id="google-adsense"')
  const bodyIndex = layout.indexOf('<body ')
  const accountMetaIndex = layout.indexOf('getGoogleAdsenseAccountMeta()')

  assert.notEqual(scriptIndex, -1)
  assert.notEqual(accountMetaIndex, -1)
  assert.notEqual(bodyIndex, -1)
  assert.ok(accountMetaIndex < bodyIndex)
  assert.ok(scriptIndex < bodyIndex)
})

test('getManualAdSlots reads optional side and bottom ad unit slots', async () => {
  const { getManualAdSlots = () => ({}) } = await loadAdsConfig()

  assert.deepEqual(
    getManualAdSlots({
      NEXT_PUBLIC_GOOGLE_ADSENSE_SIDE_SLOT: '1234567890',
      NEXT_PUBLIC_GOOGLE_ADSENSE_BOTTOM_SLOT: '0987654321',
    }),
    {
      bottom: '0987654321',
      side: '1234567890',
    }
  )

  assert.deepEqual(getManualAdSlots({}), {
    bottom: undefined,
    side: undefined,
  })
})

import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

test('sitemap omits removed privacy and contact routes', () => {
  const sitemap = fs.readFileSync('app/sitemap.ts', 'utf8')

  assert.doesNotMatch(sitemap, /'privacy'/)
  assert.doesNotMatch(sitemap, /'contact'/)
})

test('privacy and contact are not standalone public routes', () => {
  assert.equal(fs.existsSync('app/privacy/page.tsx'), false)
  assert.equal(fs.existsSync('app/contact/page.tsx'), false)
})

test('about page content includes contact methods at the bottom', () => {
  const aboutContent = fs.readFileSync('data/authors/default.mdx', 'utf8')

  const contactHeadingIndex = aboutContent.indexOf('## 联系我')
  const workHeadingIndex = aboutContent.indexOf('### 🧠 工作学习')

  assert.ok(contactHeadingIndex > workHeadingIndex)
  assert.match(aboutContent, /15230727732xlm@gmail\.com/)
  assert.match(aboutContent, /https:\/\/github\.com\/lemon956/)
})

test('navigation links contact to the about page and does not expose privacy', () => {
  const headerNav = fs.readFileSync('data/headerNavLinks.ts', 'utf8')
  const footer = fs.readFileSync('components/Footer.tsx', 'utf8')

  assert.doesNotMatch(headerNav, /href:\s*'\/privacy'/)
  assert.doesNotMatch(headerNav, /href:\s*'\/contact'/)
  assert.doesNotMatch(footer, /href="\/privacy"/)
  assert.doesNotMatch(footer, /href="\/contact"/)
  assert.match(footer, /href="\/about#联系我"/)
})

test('site metadata no longer uses starter placeholder social links', () => {
  const metadata = fs.readFileSync('data/siteMetadata.js', 'utf8')

  assert.doesNotMatch(metadata, /https:\/\/facebook\.com['"]/)
  assert.doesNotMatch(metadata, /https:\/\/youtube\.com['"]/)
  assert.doesNotMatch(metadata, /https:\/\/www\.linkedin\.com['"]/)
  assert.doesNotMatch(metadata, /https:\/\/medium\.com['"]/)
  assert.doesNotMatch(metadata, /personal blog website/)
})

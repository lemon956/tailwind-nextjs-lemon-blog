import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

test('Vercel build does not use static export when API routes are present', () => {
  const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'))
  const hasApiRoutes = fs.existsSync('app/api')

  assert.equal(hasApiRoutes, true)
  assert.doesNotMatch(vercelConfig.buildCommand || '', /\bEXPORT=1\b/)
})

test('GitHub Pages static export workflow is disabled when API routes are present', () => {
  const pagesWorkflowPath = '.github/workflows/pages.yml'
  const hasApiRoutes = fs.existsSync('app/api')

  if (!hasApiRoutes || !fs.existsSync(pagesWorkflowPath)) {
    return
  }

  const workflow = fs.readFileSync(pagesWorkflowPath, 'utf8')
  assert.doesNotMatch(workflow, /\bEXPORT:\s*1\b/)
  assert.doesNotMatch(workflow, /actions\/deploy-pages/)
})

test('Content Security Policy permits Google AdSense domains', () => {
  const nextConfig = fs.readFileSync('next.config.js', 'utf8')
  const requiredDomains = [
    'pagead2.googlesyndication.com',
    'www.googletagservices.com',
    'googleads.g.doubleclick.net',
    'tpc.googlesyndication.com',
  ]

  for (const domain of requiredDomains) {
    assert.match(nextConfig, new RegExp(domain.replaceAll('.', '\\.')))
  }
})

test('Next dev allows the local network origin used for device preview', () => {
  const nextConfig = fs.readFileSync('next.config.js', 'utf8')

  assert.match(nextConfig, /allowedDevOrigins:/)
  assert.match(nextConfig, /172\.16\.0\.225/)
})

import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

test('Vercel build does not use static export when API routes are present', () => {
  const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'))
  const hasApiRoutes = fs.existsSync('app/api')

  assert.equal(hasApiRoutes, true)
  assert.doesNotMatch(vercelConfig.buildCommand || '', /\bEXPORT=1\b/)
})

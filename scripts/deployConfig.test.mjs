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

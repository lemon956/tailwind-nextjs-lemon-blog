import assert from 'node:assert/strict'
import test from 'node:test'

import { buildWorkflowDispatchRequest } from './githubWorkflowDispatch.mjs'

test('buildWorkflowDispatchRequest builds a GitHub workflow dispatch request', () => {
  const request = buildWorkflowDispatchRequest({
    owner: 'lemon956',
    repo: 'tailwind-nextjs-lemon-blog',
    workflow: 'sync-obsidian-blog.yml',
    ref: 'main',
    token: 'github-token',
  })

  assert.equal(
    request.url,
    'https://api.github.com/repos/lemon956/tailwind-nextjs-lemon-blog/actions/workflows/sync-obsidian-blog.yml/dispatches'
  )
  assert.equal(request.options.method, 'POST')
  assert.equal(request.options.headers.Authorization, 'Bearer github-token')
  assert.deepEqual(JSON.parse(request.options.body), { ref: 'main' })
})

test('buildWorkflowDispatchRequest requires all GitHub settings', () => {
  assert.throws(
    () =>
      buildWorkflowDispatchRequest({
        owner: '',
        repo: 'repo',
        workflow: 'sync.yml',
        ref: 'main',
        token: 'token',
      }),
    /Missing GitHub workflow dispatch config: owner/
  )
})

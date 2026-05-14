import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildOutputPath,
  getPublishablePost,
  normalizeWebdavDirectory,
  renderWebdavConfig,
} from './obsidianSyncCore.mjs'

test('getPublishablePost accepts only status done posts', () => {
  const post = getPublishablePost(`---
title: Ready post
date: '2026-05-12'
status: done
tags:
  - obsidian
---

# Ready
`)

  assert.equal(post.ok, true)
  assert.equal(post.data.title, 'Ready post')
})

test('getPublishablePost skips non-done and draft posts', () => {
  assert.deepEqual(
    getPublishablePost(`---
title: Draft
date: '2026-05-12'
status: draft
---

body
`),
    { ok: false, reason: 'status_not_done' }
  )

  assert.deepEqual(
    getPublishablePost(`---
title: Hidden
date: '2026-05-12'
status: done
draft: true
---

body
`),
    { ok: false, reason: 'draft_true' }
  )
})

test('getPublishablePost skips done posts missing required blog fields', () => {
  assert.deepEqual(
    getPublishablePost(`---
title: Missing date
status: done
---

body
`),
    {
      ok: false,
      reason: 'missing_required_frontmatter',
      missing: ['date'],
    }
  )
})

test('buildOutputPath maps Obsidian blog paths into the generated blog directory', () => {
  assert.equal(
    buildOutputPath({
      remotePath: 'blog/Engineering/Hello World.md',
      sourceDir: 'blog',
      outputDir: 'data/blog/obsidian',
    }),
    'data/blog/obsidian/Engineering/Hello World.mdx'
  )
})

test('buildOutputPath strips nested WebDAV source directory prefixes', () => {
  assert.equal(
    buildOutputPath({
      remotePath: 'lemon/blog/algorithms/Two Sum.md',
      sourceDir: 'lemon/blog',
      outputDir: 'data/blog/obsidian',
    }),
    'data/blog/obsidian/algorithms/Two Sum.mdx'
  )
})

test('normalizeWebdavDirectory removes surrounding slashes', () => {
  assert.equal(normalizeWebdavDirectory('/blog/'), 'blog')
})

test('renderWebdavConfig uses the current webdav-cli write directory model', () => {
  const config = renderWebdavConfig({
    baseUrl: 'https://example.com/obsidian-webdav/',
    username: 'hermes',
    passwordEnv: 'OBSIDIAN_WEBDAV_PASSWORD',
    sourceDir: 'blog',
    writeDir: 'Inbox/Automation',
  })

  assert.match(config, /default_write_dir: "Inbox\/Automation"/)
  assert.match(config, /allow_write_dirs:\n {4}- "Inbox\/Automation"/)
  assert.match(config, /readonly_dirs:\n {4}- "blog"/)
  assert.match(config, /allow_delete: false/)
  assert.match(config, /allow_move: false/)
})

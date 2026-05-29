import assert from 'node:assert/strict'
import test from 'node:test'

import * as obsidianSyncCore from './obsidianSyncCore.mjs'

const {
  buildOutputPath,
  buildObsidianAssetCandidates,
  getPublishablePost,
  normalizeWebdavDirectory,
  renderWebdavConfig,
  rewriteObsidianAssetEmbeds,
} = obsidianSyncCore

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

test('rewriteObsidianAssetEmbeds converts embedded image links to public markdown images', () => {
  assert.equal(typeof rewriteObsidianAssetEmbeds, 'function')

  const rewritten = rewriteObsidianAssetEmbeds({
    content: `Before

![[termux_start.jpg|Termux start]]

After`,
    remotePath: 'lemon/blog/Termux Dev.md',
    sourceDir: 'lemon/blog',
    outputPath: 'data/blog/obsidian/Termux Dev.mdx',
    assetOutputDir: 'public/static/obsidian',
  })

  assert.equal(
    rewritten.content,
    `Before

![Termux start](/static/obsidian/Termux%20Dev/termux_start.jpg)

After`
  )
  assert.deepEqual(rewritten.assets, [
    {
      target: 'termux_start.jpg',
      outputPath: 'public/static/obsidian/Termux Dev/termux_start.jpg',
      publicPath: '/static/obsidian/Termux%20Dev/termux_start.jpg',
      candidates: ['lemon/blog/termux_start.jpg'],
    },
  ])
})

test('rewriteObsidianAssetEmbeds leaves regular wikilinks unchanged and deduplicates assets', () => {
  assert.equal(typeof rewriteObsidianAssetEmbeds, 'function')

  const rewritten = rewriteObsidianAssetEmbeds({
    content: `See [[Termux Dev]].

![[images/start.png]]
![[images/start.png]]`,
    remotePath: 'lemon/blog/posts/Termux Dev.md',
    sourceDir: 'lemon/blog',
    outputPath: 'data/blog/obsidian/posts/Termux Dev.mdx',
    assetOutputDir: 'public/static/obsidian',
    assetDirs: ['lemon/assets'],
  })

  assert.equal(
    rewritten.content,
    `See [[Termux Dev]].

![start](/static/obsidian/posts/Termux%20Dev/images/start.png)
![start](/static/obsidian/posts/Termux%20Dev/images/start.png)`
  )
  assert.equal(rewritten.assets.length, 1)
  assert.deepEqual(rewritten.assets[0].candidates, [
    'lemon/blog/posts/images/start.png',
    'lemon/assets/images/start.png',
  ])
})

test('buildObsidianAssetCandidates checks note-relative paths before configured asset dirs', () => {
  assert.equal(typeof buildObsidianAssetCandidates, 'function')

  assert.deepEqual(
    buildObsidianAssetCandidates({
      target: 'termux_start.jpg',
      remotePath: 'lemon/blog/posts/Termux Dev.md',
      sourceDir: 'lemon/blog',
      assetDirs: ['lemon/blog/assets', '/lemon/shared-assets/'],
    }),
    [
      'lemon/blog/posts/termux_start.jpg',
      'lemon/blog/assets/termux_start.jpg',
      'lemon/shared-assets/termux_start.jpg',
      'lemon/blog/termux_start.jpg',
    ]
  )
})

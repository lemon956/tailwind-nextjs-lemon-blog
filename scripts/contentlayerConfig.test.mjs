import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

test('Blog schema declares Obsidian sync frontmatter fields', () => {
  const config = fs.readFileSync('contentlayer.config.ts', 'utf8')

  assert.match(config, /status:\s*\{\s*type:\s*'string'\s*\}/)
  assert.match(
    config,
    /title_candidates:\s*\{\s*type:\s*'list',\s*of:\s*\{\s*type:\s*'string'\s*\}/
  )
})

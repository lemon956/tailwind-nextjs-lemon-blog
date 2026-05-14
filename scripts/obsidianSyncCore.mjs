import path from 'node:path'
import matter from 'gray-matter'

export function normalizeWebdavDirectory(value) {
  return String(value || '')
    .trim()
    .replace(/^\/+|\/+$/g, '')
}

export function getPublishablePost(content) {
  const parsed = matter(content)
  const status = String(parsed.data.status || '')
    .trim()
    .toLowerCase()

  if (status !== 'done') {
    return { ok: false, reason: 'status_not_done' }
  }

  if (parsed.data.draft === true) {
    return { ok: false, reason: 'draft_true' }
  }

  const missing = ['title', 'date'].filter((field) => !parsed.data[field])
  if (missing.length > 0) {
    return {
      ok: false,
      reason: 'missing_required_frontmatter',
      missing,
    }
  }

  return {
    ok: true,
    data: parsed.data,
    content,
  }
}

export function buildOutputPath({ remotePath, sourceDir, outputDir }) {
  const normalizedSource = normalizeWebdavDirectory(sourceDir)
  const normalizedRemote = normalizeWebdavDirectory(remotePath)
  const prefix = `${normalizedSource}/`
  const relativeRemote = normalizedRemote.startsWith(prefix)
    ? normalizedRemote.slice(prefix.length)
    : normalizedRemote
  const parsed = path.posix.parse(relativeRemote)
  const outputRelative = path.posix.join(parsed.dir, `${parsed.name}.mdx`)
  return path.posix.join(normalizeWebdavDirectory(outputDir), outputRelative)
}

export function isMarkdownPath(remotePath) {
  return /\.(md|mdx)$/i.test(remotePath)
}

export function renderWebdavConfig(config) {
  const sourceDir = normalizeWebdavDirectory(config.sourceDir)
  const writeDir = normalizeWebdavDirectory(config.writeDir || 'Inbox/Hermes')

  return `webdav:
  base_url: ${yamlString(config.baseUrl)}
  username: ${yamlString(config.username)}
  password_env: ${yamlString(config.passwordEnv)}
  timeout: 30

vault:
  default_write_dir: ${yamlString(writeDir)}
  timezone: Asia/Hong_Kong
  filename_time_format: "%Y-%m-%d-%H%M%S"
  default_tags: []

behavior:
  allow_overwrite: false
  allow_delete: false
  allow_move: false
  allow_write_dirs:
    - ${yamlString(writeDir)}
  readonly_dirs:
    - ${yamlString(sourceDir)}

markdown:
  frontmatter: true
  heading_title: true
  add_created_time: true
  add_source: true
  default_source: obsidian
`
}

function yamlString(value) {
  return JSON.stringify(String(value || ''))
}

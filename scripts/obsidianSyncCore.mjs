import path from 'node:path'
import matter from 'gray-matter'

const OBSIDIAN_EMBED_RE = /!\[\[([^\]\n]+)\]\]/g
const IMAGE_EXTENSIONS = new Set([
  '.apng',
  '.avif',
  '.bmp',
  '.gif',
  '.ico',
  '.jpeg',
  '.jpg',
  '.png',
  '.svg',
  '.webp',
])
const ASSET_EXTENSIONS = new Set([
  ...IMAGE_EXTENSIONS,
  '.m4a',
  '.mov',
  '.mp3',
  '.mp4',
  '.ogg',
  '.pdf',
  '.wav',
  '.webm',
])

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

export function rewriteObsidianAssetEmbeds({
  content,
  remotePath,
  sourceDir,
  outputPath,
  assetOutputDir = 'public/static/obsidian',
  assetDirs = [],
}) {
  const assets = new Map()
  const rewritten = String(content || '').replace(OBSIDIAN_EMBED_RE, (match, rawEmbed) => {
    const embed = parseObsidianAssetEmbed(rawEmbed)
    if (!embed || !isSupportedAsset(embed.target)) {
      return match
    }

    const postAssetDir = buildPostAssetDirectory(outputPath)
    const outputPathForAsset = path.posix.join(
      normalizeWebdavDirectory(assetOutputDir),
      postAssetDir,
      embed.target
    )
    const publicPath = buildPublicAssetPath(outputPathForAsset)
    const key = outputPathForAsset

    if (!assets.has(key)) {
      assets.set(key, {
        target: embed.target,
        outputPath: outputPathForAsset,
        publicPath,
        candidates: buildObsidianAssetCandidates({
          target: embed.target,
          remotePath,
          sourceDir,
          assetDirs,
        }),
      })
    }

    const label = embed.label || path.posix.basename(embed.target, path.posix.extname(embed.target))
    if (isImageAsset(embed.target)) {
      return `![${escapeMarkdownLabel(label)}](${publicPath})`
    }
    return `[${escapeMarkdownLabel(label)}](${publicPath})`
  })

  return {
    content: rewritten,
    assets: [...assets.values()],
  }
}

export function buildObsidianAssetCandidates({ target, remotePath, sourceDir, assetDirs = [] }) {
  const normalizedTarget = normalizeObsidianAssetTarget(target)
  const noteDir = normalizeWebdavDirectory(path.posix.dirname(normalizeWebdavDirectory(remotePath)))
  const normalizedSourceDir = normalizeWebdavDirectory(sourceDir)
  const candidates = []

  addUniquePath(candidates, path.posix.join(noteDir, normalizedTarget))
  for (const assetDir of assetDirs) {
    addUniquePath(candidates, path.posix.join(normalizeWebdavDirectory(assetDir), normalizedTarget))
  }
  if (!normalizedTarget.includes('/')) {
    addUniquePath(candidates, path.posix.join(normalizedSourceDir, normalizedTarget))
  }

  return candidates
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

function parseObsidianAssetEmbed(rawEmbed) {
  const [rawTarget, rawLabel] = String(rawEmbed || '').split('|')
  const target = normalizeObsidianAssetTarget(rawTarget.split('#')[0])
  if (!target) {
    return null
  }

  return {
    target,
    label: normalizeObsidianLabel(rawLabel),
  }
}

function normalizeObsidianAssetTarget(value) {
  const normalized = path.posix.normalize(
    String(value || '')
      .trim()
      .replace(/\\/g, '/')
      .replace(/^\/+/, '')
  )

  if (!normalized || normalized === '.') {
    return ''
  }
  if (normalized === '..' || normalized.startsWith('../') || normalized.includes('/../')) {
    throw new Error(`Unsafe Obsidian asset reference: ${value}`)
  }

  return normalized
}

function normalizeObsidianLabel(value) {
  const label = String(value || '').trim()
  if (!label || /^\d+(x\d+)?$/i.test(label)) {
    return ''
  }
  return label
}

function isSupportedAsset(target) {
  return ASSET_EXTENSIONS.has(path.posix.extname(target).toLowerCase())
}

function isImageAsset(target) {
  return IMAGE_EXTENSIONS.has(path.posix.extname(target).toLowerCase())
}

function buildPostAssetDirectory(outputPath) {
  const normalizedOutput = normalizeWebdavDirectory(outputPath)
  const parsed = path.posix.parse(normalizedOutput)
  const postPath = path.posix.join(parsed.dir, parsed.name)

  for (const prefix of ['data/blog/obsidian/', 'data/blog/']) {
    if (postPath.startsWith(prefix)) {
      return postPath.slice(prefix.length)
    }
  }

  return postPath
}

function buildPublicAssetPath(outputPath) {
  const normalized = normalizeWebdavDirectory(outputPath)
  if (!normalized.startsWith('public/')) {
    throw new Error(`Obsidian asset output must be under public/: ${outputPath}`)
  }

  return `/${normalized
    .slice('public/'.length)
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/')}`
}

function escapeMarkdownLabel(value) {
  return String(value || '').replace(/]/g, '\\]')
}

function addUniquePath(paths, value) {
  const normalized = normalizeWebdavDirectory(value)
  if (normalized && !paths.includes(normalized)) {
    paths.push(normalized)
  }
}

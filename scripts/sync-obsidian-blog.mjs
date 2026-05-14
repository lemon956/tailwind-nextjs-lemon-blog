#!/usr/bin/env node

import { spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  buildOutputPath,
  getPublishablePost,
  isMarkdownPath,
  normalizeWebdavDirectory,
  renderWebdavConfig,
} from './obsidianSyncCore.mjs'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const config = readConfig()
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'obsidian-blog-sync-'))
  const configPath = path.join(tempDir, 'webdav-cli.yaml')

  try {
    await fs.writeFile(configPath, renderWebdavConfig(config), 'utf8')
    const remoteFiles = await listMarkdownFiles(config, configPath)
    const seenOutputs = new Set()
    const publishable = []
    const skipped = []

    for (const remotePath of remoteFiles) {
      const content = await runWebdavCli(config, configPath, ['cat', remotePath])
      const post = getPublishablePost(content)
      if (!post.ok) {
        skipped.push({ path: remotePath, reason: post.reason })
        continue
      }

      const outputPath = buildOutputPath({
        remotePath,
        sourceDir: config.sourceDir,
        outputDir: config.outputDir,
      })

      if (seenOutputs.has(outputPath)) {
        throw new Error(`multiple Obsidian notes map to the same output path: ${outputPath}`)
      }
      seenOutputs.add(outputPath)
      publishable.push({ remotePath, outputPath, content: post.content })
    }

    if (!dryRun) {
      await fs.rm(path.join(rootDir, config.outputDir), { recursive: true, force: true })
      await fs.mkdir(path.join(rootDir, config.outputDir), { recursive: true })
      for (const post of publishable) {
        const absoluteOutput = path.join(rootDir, post.outputPath)
        await fs.mkdir(path.dirname(absoluteOutput), { recursive: true })
        await fs.writeFile(absoluteOutput, post.content, 'utf8')
      }
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          action: dryRun ? 'planned' : 'synced',
          sourceDir: config.sourceDir,
          outputDir: config.outputDir,
          scanned: remoteFiles.length,
          synced: publishable.length,
          skipped: skipped.length,
          skippedByReason: countByReason(skipped),
        },
        null,
        2
      )
    )
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true })
  }
}

function readConfig() {
  return {
    cli: process.env.OBSIDIAN_SYNC_CLI || 'webdav-cli',
    baseUrl: requireEnv('OBSIDIAN_WEBDAV_URL'),
    username: requireEnv('OBSIDIAN_WEBDAV_USERNAME'),
    passwordEnv: 'OBSIDIAN_WEBDAV_PASSWORD',
    password: requireEnv('OBSIDIAN_WEBDAV_PASSWORD'),
    sourceDir: normalizeWebdavDirectory(process.env.OBSIDIAN_SYNC_SOURCE_DIR || 'lemon/blog'),
    outputDir: normalizeWebdavDirectory(
      process.env.OBSIDIAN_SYNC_OUTPUT_DIR || 'data/blog/obsidian'
    ),
    writeDir: normalizeWebdavDirectory(process.env.OBSIDIAN_SYNC_WRITE_DIR || 'Inbox/Hermes'),
  }
}

function requireEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

async function listMarkdownFiles(config, configPath) {
  const stack = [config.sourceDir]
  const files = []

  while (stack.length > 0) {
    const current = stack.pop()
    const output = await runWebdavCli(config, configPath, ['ls', current, '--json'])
    const parsed = JSON.parse(output)
    const entries = parsed.entries || []

    for (const entry of entries) {
      if (entry.is_dir) {
        stack.push(entry.path)
      } else if (isMarkdownPath(entry.path)) {
        files.push(entry.path)
      }
    }
  }

  files.sort()
  return files
}

async function runWebdavCli(config, configPath, args) {
  const env = {
    ...process.env,
    [config.passwordEnv]: config.password,
  }
  return runCommand(config.cli, ['--config', configPath, ...args], env)
}

function runCommand(command, args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: rootDir,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (chunk) => {
      stdout += chunk
    })
    child.stderr.on('data', (chunk) => {
      stderr += chunk
    })
    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout.trimEnd())
        return
      }
      reject(new Error(`${command} ${args.join(' ')} failed with exit ${code}: ${stderr.trim()}`))
    })
  })
}

function countByReason(skipped) {
  return skipped.reduce((acc, item) => {
    acc[item.reason] = (acc[item.reason] || 0) + 1
    return acc
  }, {})
}

main().catch((error) => {
  console.error(error.stack || error.message)
  process.exitCode = 1
})

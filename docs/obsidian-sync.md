# Obsidian Blog Sync

This project can sync completed Obsidian notes into the blog content directory.

## Source And Filter

- Source WebDAV directory: `lemon/blog`
- Local generated directory: `data/blog/obsidian`
- WebDAV controlled write directory in the generated `webdav-cli` config: `Inbox/Hermes`
- Included notes: Markdown or MDX files with frontmatter `status: done`
- Excluded notes: missing `status`, any status other than `done`, `draft: true`, or missing required blog fields `title`/`date`

The sync script clears only `data/blog/obsidian` before writing synced files. Existing hand-written posts outside that directory are left untouched. This project only uses `webdav-cli ls --json` and `webdav-cli cat` for the blog sync; it does not write, delete, move, copy, lock, or change properties in Obsidian.

## Local Sync

Install `webdav-cli` first:

```bash
cargo install --git https://github.com/lemon956/obsidian-cli --locked --bin webdav-cli
```

Set environment variables:

```bash
export OBSIDIAN_WEBDAV_URL="https://example.com/obsidian-webdav/"
export OBSIDIAN_WEBDAV_USERNAME="hermes"
export OBSIDIAN_WEBDAV_PASSWORD="your-password"
export OBSIDIAN_SYNC_SOURCE_DIR="lemon/blog"
export OBSIDIAN_SYNC_WRITE_DIR="Inbox/Hermes"
```

Run:

```bash
npm run sync:obsidian
```

Use `--dry-run` to scan without writing files:

```bash
npm run sync:obsidian -- --dry-run
```

## GitHub Actions Sync

Workflow: `.github/workflows/sync-obsidian-blog.yml`

Triggers:

- Manual: GitHub Actions -> `Sync Obsidian Blog` -> `Run workflow`
- Scheduled: every 6 hours
- Vercel API route: `POST /api/obsidian-sync`

Required GitHub repository secrets:

```text
OBSIDIAN_WEBDAV_URL
OBSIDIAN_WEBDAV_USERNAME
OBSIDIAN_WEBDAV_PASSWORD
```

The workflow installs `webdav-cli` from `https://github.com/lemon956/obsidian-cli`, runs `npm run sync:obsidian`, runs `npm run build`, and commits changes in `data/blog/obsidian` plus `app/tag-data.json` when generated content changes.

The workflow defaults to `OBSIDIAN_SYNC_SOURCE_DIR=lemon/blog`, matching the WebDAV paths returned by `webdav-cli` for this vault. You can override `OBSIDIAN_SYNC_SOURCE_DIR`, `OBSIDIAN_SYNC_OUTPUT_DIR`, or `OBSIDIAN_SYNC_WRITE_DIR` in GitHub repository Variables without changing the workflow file.

`webdav-cli` 0.1.3 keeps read commands unchanged (`ls`, `cat`, `search`) and adds controlled WebDAV method commands such as `delete`, `move`, `copy`, `proppatch`, `lock`, and `unlock`. Those method commands are restricted to `behavior.allow_write_dirs`; `delete` and `move` also require `behavior.allow_delete` or `behavior.allow_move`. The sync config keeps those destructive switches disabled.

If you run `webdav-cli doctor` against the same endpoint, the current tool expects the configured write directory, normally `Inbox/Hermes`, to advertise full HTTP/WebDAV methods. The blog sync itself only needs read access to `OBSIDIAN_SYNC_SOURCE_DIR`.

## Vercel Manual Trigger

Set these Vercel environment variables:

```text
OBSIDIAN_SYNC_TRIGGER_SECRET
GITHUB_SYNC_TOKEN
GITHUB_SYNC_OWNER=lemon956
GITHUB_SYNC_REPO=tailwind-nextjs-lemon-blog
GITHUB_SYNC_WORKFLOW=sync-obsidian-blog.yml
GITHUB_SYNC_REF=main
```

`GITHUB_SYNC_TOKEN` must be able to dispatch GitHub Actions workflows for this repository.

Trigger with:

```bash
curl -X POST "https://your-vercel-domain/api/obsidian-sync" \
  -H "x-obsidian-sync-secret: $OBSIDIAN_SYNC_TRIGGER_SECRET"
```

The Vercel route does not write blog files directly. It dispatches the GitHub Actions workflow, and the workflow commits synced posts. Vercel then redeploys from the pushed commit.

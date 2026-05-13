import { NextResponse } from 'next/server'
import { buildWorkflowDispatchRequest } from '../../../scripts/githubWorkflowDispatch.mjs'

export const dynamic = 'force-dynamic'

const DEFAULT_WORKFLOW = 'sync-obsidian-blog.yml'
const DEFAULT_REF = 'main'

export async function POST(request: Request) {
  const expectedSecret = process.env.OBSIDIAN_SYNC_TRIGGER_SECRET
  const providedSecret =
    request.headers.get('x-obsidian-sync-secret') ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')

  if (!expectedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  let dispatch: ReturnType<typeof buildWorkflowDispatchRequest>
  try {
    dispatch = buildWorkflowDispatchRequest({
      owner: process.env.GITHUB_SYNC_OWNER || '',
      repo: process.env.GITHUB_SYNC_REPO || '',
      workflow: process.env.GITHUB_SYNC_WORKFLOW || DEFAULT_WORKFLOW,
      ref: process.env.GITHUB_SYNC_REF || DEFAULT_REF,
      token: process.env.GITHUB_SYNC_TOKEN || '',
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: 'github_workflow_dispatch_not_configured',
        message: error instanceof Error ? error.message : 'unknown configuration error',
      },
      { status: 500 }
    )
  }

  const response = await fetch(dispatch.url, dispatch.options)
  if (!response.ok) {
    const message = await response.text()
    return NextResponse.json(
      {
        ok: false,
        error: 'github_workflow_dispatch_failed',
        status: response.status,
        message,
      },
      { status: 502 }
    )
  }

  return NextResponse.json({
    ok: true,
    action: 'workflow_dispatched',
    workflow: process.env.GITHUB_SYNC_WORKFLOW || DEFAULT_WORKFLOW,
    ref: process.env.GITHUB_SYNC_REF || DEFAULT_REF,
  })
}

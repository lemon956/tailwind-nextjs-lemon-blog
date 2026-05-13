export function buildWorkflowDispatchRequest({ owner, repo, workflow, ref, token }) {
  const values = { owner, repo, workflow, ref, token }
  const missing = Object.entries(values)
    .filter(([, value]) => !String(value || '').trim())
    .map(([key]) => key)

  if (missing.length > 0) {
    throw new Error(`Missing GitHub workflow dispatch config: ${missing.join(', ')}`)
  }

  return {
    url: `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflow}/dispatches`,
    options: {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({ ref }),
    },
  }
}

export function calculateTextMatches(text: string, query: string): number[] {
  const normalizedQuery = query.trim()
  if (!normalizedQuery || text.length === 0) return []

  const matches: number[] = []
  const lowerText = text.toLowerCase()
  const lowerQuery = normalizedQuery.toLowerCase()
  let index = 0

  while ((index = lowerText.indexOf(lowerQuery, index)) !== -1) {
    matches.push(index)
    index += 1
  }

  return matches
}

export function getNextSearchIndex(currentIndex: number, matchCount: number, direction: 1 | -1) {
  if (matchCount <= 0) return -1
  if (currentIndex < 0 || currentIndex >= matchCount) return direction === 1 ? 0 : matchCount - 1
  return (currentIndex + direction + matchCount) % matchCount
}

export function getCenteredScrollOffset({
  scrollOffset,
  containerStart,
  containerSize,
  targetStart,
  targetSize,
}: {
  scrollOffset: number
  containerStart: number
  containerSize: number
  targetStart: number
  targetSize: number
}) {
  const centeredOffset =
    scrollOffset + targetStart - containerStart - containerSize / 2 + targetSize / 2
  return Math.max(0, Math.round(centeredOffset))
}

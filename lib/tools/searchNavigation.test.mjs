import assert from 'node:assert/strict'
import test from 'node:test'

import {
  calculateTextMatches,
  getCenteredScrollOffset,
  getNextSearchIndex,
} from './searchNavigation.ts'

test('calculateTextMatches finds every case-insensitive match', () => {
  assert.deepEqual(calculateTextMatches('Name name NAME', 'name'), [0, 5, 10])
})

test('calculateTextMatches supports overlapping matches', () => {
  assert.deepEqual(calculateTextMatches('banana', 'ana'), [1, 3])
})

test('getNextSearchIndex wraps through matches in both directions', () => {
  assert.equal(getNextSearchIndex(-1, 4, 1), 0)
  assert.equal(getNextSearchIndex(0, 4, 1), 1)
  assert.equal(getNextSearchIndex(3, 4, 1), 0)
  assert.equal(getNextSearchIndex(0, 4, -1), 3)
})

test('getNextSearchIndex returns -1 when there are no matches', () => {
  assert.equal(getNextSearchIndex(2, 0, 1), -1)
})

test('getCenteredScrollOffset centers a target within an existing scroll container', () => {
  assert.equal(
    getCenteredScrollOffset({
      scrollOffset: 120,
      containerStart: 400,
      containerSize: 560,
      targetStart: 820,
      targetSize: 20,
    }),
    270
  )
})

test('getCenteredScrollOffset never returns a negative scroll offset', () => {
  assert.equal(
    getCenteredScrollOffset({
      scrollOffset: 10,
      containerStart: 100,
      containerSize: 560,
      targetStart: 120,
      targetSize: 20,
    }),
    0
  )
})

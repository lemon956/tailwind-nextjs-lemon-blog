import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const themeCss = fs.readFileSync('css/tailwind.css', 'utf8')
const rootLayout = fs.readFileSync('app/layout.tsx', 'utf8')
const header = fs.readFileSync('components/Header.tsx', 'utf8')

function getColorVariable(name) {
  const match = themeCss.match(new RegExp(`--color-${name}:\\s*([^;]+);`))
  assert.ok(match, `Expected --color-${name} to be defined`)
  return match[1].trim()
}

function getDarkColorVariable(name) {
  const match = themeCss.match(/\.dark\s*{([\s\S]*?)\n\s*}/)
  assert.ok(match, 'Expected dark mode color overrides to be defined')
  const color = match[1].match(new RegExp(`--color-${name}:\\s*([^;]+);`))
  assert.ok(color, `Expected dark mode --color-${name} to be defined`)
  return color[1].trim()
}

test('uses soft Lemon Grove background and green colors in light mode', () => {
  const expectedColors = {
    'primary-50': '#f7fee7',
    'primary-100': '#ecfccb',
    'primary-200': '#d9f99d',
    'primary-300': '#bef264',
    'primary-400': '#84cc16',
    'primary-500': '#4d7c0f',
    'primary-600': '#3f6212',
    'primary-700': '#36570c',
    'primary-800': '#2c450f',
    'primary-900': '#1a2e05',
    'primary-950': '#0f1d03',
    'gray-50': '#fbfff2',
    'gray-200': '#e4e4e7',
    'gray-500': '#71717a',
    'gray-900': '#18181b',
    'gray-950': '#09090b',
  }

  for (const [name, expectedValue] of Object.entries(expectedColors)) {
    assert.equal(getColorVariable(name), expectedValue)
  }
})

test('uses warm non-green accents in dark mode', () => {
  const expectedColors = {
    'primary-400': '#fbbf24',
    'primary-500': '#f59e0b',
    'primary-600': '#d97706',
    'gray-50': '#f8fafc',
    'gray-800': '#1e293b',
    'gray-900': '#111827',
    'gray-950': '#0f172a',
  }

  for (const [name, expectedValue] of Object.entries(expectedColors)) {
    assert.equal(getDarkColorVariable(name), expectedValue)
  }
})

test('uses soft Lemon Grove page chrome with green light-mode branding', () => {
  assert.match(rootLayout, /color="#4d7c0f"/)
  assert.match(rootLayout, /msapplication-TileColor" content="#4d7c0f"/)
  assert.match(rootLayout, /prefers-color-scheme: light\)" content="#fbfff2"/)
  assert.match(rootLayout, /prefers-color-scheme: dark\)" content="#0f172a"/)
  assert.match(
    rootLayout,
    /body className="bg-gray-50 pl-\[calc\(100vw-100%\)\] text-gray-900 antialiased dark:bg-gray-950 dark:text-gray-50"/
  )
})

test('keeps the header on the same surface as the page', () => {
  assert.match(
    header,
    /bg-gray-50 dark:bg-gray-950/,
    'Header should not keep a white strip on the Lemon Grove page surface'
  )
})

test('replaces hard black third-party dark surfaces with theme colors', () => {
  assert.match(themeCss, /\.dark \.dark\\:bg-black/)
  assert.match(themeCss, /\.dark \.dark\\:ring-offset-black/)
})

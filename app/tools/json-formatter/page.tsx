'use client'

import { memo, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { ToolButton, ToolNotice, ToolPanel, ToolWorkbench } from '@/components/tools/ToolWorkbench'
import {
  calculateTextMatches,
  getCenteredScrollOffset,
  getNextSearchIndex,
} from '../../../lib/tools/searchNavigation'

type FixOption =
  | 'all'
  | 'remove-bom'
  | 'trim-whitespace'
  | 'fix-escaped-json'
  | 'fix-newlines'
  | 'normalize-newlines'
  | 'remove-empty-lines'

const FIX_OPTIONS: { value: FixOption; label: string; description: string }[] = [
  { value: 'all', label: '全部修复', description: '执行所有修复操作' },
  { value: 'remove-bom', label: '移除 BOM 字符', description: '删除文件开头的 BOM 标记' },
  { value: 'trim-whitespace', label: '移除首尾空白', description: '删除 JSON 字符串首尾空白' },
  {
    value: 'fix-escaped-json',
    label: '修复转义 JSON',
    description: '处理裸露转义格式，如 {\\"key\\":\\"value\\"}',
  },
  { value: 'fix-newlines', label: '修复换行符错误', description: '移除键名和值中的非法换行符' },
  { value: 'normalize-newlines', label: '标准化换行符', description: '将 CRLF 和 CR 统一为 LF' },
  { value: 'remove-empty-lines', label: '移除多余空行', description: '删除连续超过两个的空行' },
]

function countLines(value: string) {
  return value.length === 0 ? 1 : value.split('\n').length
}

function countBytes(value: string) {
  return new Blob([value]).size
}

function formatMeta(value: string) {
  return `${countLines(value)} 行 / ${value.length} 字符 / ${countBytes(value)} bytes`
}

const searchMarkClass =
  'rounded-sm bg-amber-300 text-gray-950 transition-colors data-[current=true]:bg-sky-300 data-[current=true]:ring-2 data-[current=true]:ring-sky-500 data-[current=true]:ring-offset-1 data-[current=true]:ring-offset-white dark:bg-amber-500 dark:text-gray-950 dark:data-[current=true]:bg-sky-400 dark:data-[current=true]:ring-offset-gray-950'

const searchNavButtonClass =
  'min-h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm transition-colors hover:border-sky-400 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200 dark:hover:border-sky-500 dark:hover:text-sky-300'

const formatterPaneHeightClass = 'h-[clamp(680px,72vh,900px)]'

function LineNumbers({ text }: { text: string }) {
  return (
    <div className="min-w-12 border-r border-gray-200 bg-gray-50 px-3 py-4 text-right dark:border-gray-800 dark:bg-gray-900">
      {Array.from({ length: countLines(text) }).map((_, index) => (
        <div
          key={index}
          className="font-mono text-xs leading-6 text-gray-400 select-none dark:text-gray-500"
        >
          {index + 1}
        </div>
      ))}
    </div>
  )
}

function HighlightText({ text, searchQuery }: { text: string; searchQuery: string }) {
  const normalizedQuery = searchQuery.trim()
  if (!normalizedQuery) return <span>{text}</span>

  const matches = calculateTextMatches(text, normalizedQuery)
  if (matches.length === 0) return <span>{text}</span>

  const parts: ReactNode[] = []
  let lastIndex = 0

  matches.forEach((match, index) => {
    parts.push(text.slice(lastIndex, match))
    parts.push(
      <mark key={index} className={searchMarkClass} data-json-search-match="true">
        {text.slice(match, match + normalizedQuery.length)}
      </mark>
    )
    lastIndex = match + normalizedQuery.length
  })

  parts.push(text.slice(lastIndex))
  return <span>{parts}</span>
}

interface JsonNodeProps {
  data: unknown
  keyName?: string
  level?: number
  indent?: number
  onCopySuccess?: () => void
  searchQuery?: string
}

const JsonNode = memo(function JsonNode({
  data,
  keyName,
  level = 0,
  indent = 2,
  onCopySuccess,
  searchQuery = '',
}: JsonNodeProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [showCopy, setShowCopy] = useState(false)
  const isObject = typeof data === 'object' && data !== null && !Array.isArray(data)
  const isArray = Array.isArray(data)
  const isCollapsible = isObject || isArray
  const indentPx = level * (indent * 10)

  const handleCopy = async (event: React.MouseEvent) => {
    event.stopPropagation()
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, indent))
      onCopySuccess?.()
    } catch {
      alert('复制失败')
    }
  }

  const handleCopyKeyValue = async (event: React.MouseEvent) => {
    event.stopPropagation()
    try {
      const value = keyName
        ? `"${keyName}": ${JSON.stringify(data, null, indent)}`
        : JSON.stringify(data, null, indent)
      await navigator.clipboard.writeText(value)
      onCopySuccess?.()
    } catch {
      alert('复制失败')
    }
  }

  if (!isCollapsible) {
    const valueClass =
      typeof data === 'string'
        ? 'text-emerald-600 dark:text-emerald-400'
        : typeof data === 'number'
        ? 'text-sky-600 dark:text-sky-400'
        : typeof data === 'boolean'
        ? 'text-amber-600 dark:text-amber-400'
        : data === null
        ? 'text-gray-500 dark:text-gray-400'
        : 'text-gray-700 dark:text-gray-300'

    return (
      <div
        style={{ paddingLeft: `${indentPx}px` }}
        className="group relative rounded py-0.5 font-mono text-sm leading-6 hover:bg-gray-100 dark:hover:bg-gray-900"
        onMouseEnter={() => setShowCopy(true)}
        onMouseLeave={() => setShowCopy(false)}
      >
        <div className="flex items-center">
          <div className="min-w-0 flex-1">
            {keyName && (
              <span className="font-medium text-red-600 dark:text-red-400">
                <HighlightText text={`"${keyName}"`} searchQuery={searchQuery} />
              </span>
            )}
            {keyName && <span className="text-gray-500 dark:text-gray-400">: </span>}
            <span className={valueClass}>
              {typeof data === 'string' ? (
                <HighlightText text={`"${data}"`} searchQuery={searchQuery} />
              ) : data === null ? (
                <HighlightText text="null" searchQuery={searchQuery} />
              ) : (
                <HighlightText text={String(data)} searchQuery={searchQuery} />
              )}
            </span>
            {level > 0 && <span className="text-gray-400 dark:text-gray-500">,</span>}
          </div>
          {showCopy && keyName && (
            <button
              onClick={handleCopyKeyValue}
              className="ml-2 rounded border border-gray-200 px-1.5 py-0.5 text-xs text-gray-500 opacity-0 transition-opacity group-hover:opacity-100 hover:border-sky-400 hover:text-sky-600 dark:border-gray-800 dark:text-gray-400 dark:hover:border-sky-500 dark:hover:text-sky-400"
              title="复制此键值对"
            >
              复制
            </button>
          )}
        </div>
      </div>
    )
  }

  const entries = isArray ? data : Object.entries(data as Record<string, unknown>)
  const openBracket = isArray ? '[' : '{'
  const closeBracket = isArray ? ']' : '}'
  const itemCount = isArray ? (data as unknown[]).length : Object.keys(data as object).length

  return (
    <div className="font-mono text-sm">
      <div
        style={{ paddingLeft: `${indentPx}px` }}
        className="group relative rounded py-0.5 leading-6 hover:bg-gray-100 dark:hover:bg-gray-900"
        onMouseEnter={() => setShowCopy(true)}
        onMouseLeave={() => setShowCopy(false)}
      >
        <div className="flex items-center">
          <div className="min-w-0 flex-1">
            {keyName && (
              <>
                <span className="font-medium text-red-600 dark:text-red-400">
                  <HighlightText text={`"${keyName}"`} searchQuery={searchQuery} />
                </span>
                <span className="text-gray-500 dark:text-gray-400">: </span>
              </>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="inline-flex items-center rounded px-1 transition-colors hover:bg-gray-200 dark:hover:bg-gray-800"
              title={collapsed ? '展开' : '折叠'}
            >
              <span className="mr-1 text-xs text-gray-400 select-none dark:text-gray-500">
                {collapsed ? '>' : 'v'}
              </span>
              <span className="font-bold text-gray-700 dark:text-gray-300">
                <HighlightText text={openBracket} searchQuery={searchQuery} />
              </span>
            </button>
            {collapsed && (
              <>
                <span className="ml-2 text-xs text-gray-400 italic dark:text-gray-500">
                  {itemCount} {isArray ? 'items' : 'keys'}
                </span>
                <span className="ml-1 font-bold text-gray-700 dark:text-gray-300">
                  <HighlightText text={closeBracket} searchQuery={searchQuery} />
                </span>
                {level > 0 && <span className="text-gray-400 dark:text-gray-500">,</span>}
              </>
            )}
          </div>
          {showCopy && (
            <button
              onClick={handleCopy}
              className="ml-2 rounded border border-gray-200 px-1.5 py-0.5 text-xs text-gray-500 opacity-0 transition-opacity group-hover:opacity-100 hover:border-sky-400 hover:text-sky-600 dark:border-gray-800 dark:text-gray-400 dark:hover:border-sky-500 dark:hover:text-sky-400"
              title="复制此节点"
            >
              复制
            </button>
          )}
        </div>
      </div>
      {!collapsed && (
        <>
          {isArray
            ? (data as unknown[]).map((item, index) => (
                <JsonNode
                  key={index}
                  data={item}
                  level={level + 1}
                  indent={indent}
                  onCopySuccess={onCopySuccess}
                  searchQuery={searchQuery}
                />
              ))
            : (entries as [string, unknown][]).map(([key, value]) => (
                <JsonNode
                  key={key}
                  keyName={key}
                  data={value}
                  level={level + 1}
                  indent={indent}
                  onCopySuccess={onCopySuccess}
                  searchQuery={searchQuery}
                />
              ))}
          <div
            style={{ paddingLeft: `${indentPx}px` }}
            className="rounded py-0.5 leading-6 hover:bg-gray-100 dark:hover:bg-gray-900"
          >
            <span className="font-bold text-gray-700 dark:text-gray-300">{closeBracket}</span>
            {level > 0 && <span className="text-gray-400 dark:text-gray-500">,</span>}
          </div>
        </>
      )}
    </div>
  )
})

function renderHighlightedText(text: string, query: string) {
  const normalizedQuery = query.trim()
  if (!normalizedQuery) return text
  const matches = calculateTextMatches(text, normalizedQuery)
  if (matches.length === 0) return text

  const parts: ReactNode[] = []
  let lastIndex = 0

  matches.forEach((match, index) => {
    parts.push(text.slice(lastIndex, match))
    parts.push(
      <mark key={index} className={searchMarkClass} data-json-search-match="true">
        {text.slice(match, match + normalizedQuery.length)}
      </mark>
    )
    lastIndex = match + normalizedQuery.length
  })

  parts.push(text.slice(lastIndex))
  return parts
}

function preprocessJSON(text: string): string {
  text = text.replace(/^\uFEFF/, '').trim()

  if (text.match(/^[{[]\\"/)) {
    text = text.replace(/([^\\])\n/g, '$1')
    text = text.replace(/([^\\])\r\n/g, '$1')
    text = text.replace(/([^\\])\r/g, '$1')

    const placeholder = '___BACKSLASH___'
    let unescaped = text.replace(/\\\\/g, placeholder)
    unescaped = unescaped.replace(/\\"/g, '"')
    unescaped = unescaped.replace(new RegExp(placeholder, 'g'), '\\')

    try {
      JSON.parse(unescaped)
      return unescaped
    } catch {
      return text
    }
  }

  return text
}

function parseJSON(text: string) {
  let parsed = JSON.parse(preprocessJSON(text))

  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(preprocessJSON(parsed))
    } catch {
      return parsed
    }
  }

  return parsed
}

export default function JsonFormatter() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [indent, setIndent] = useState(2)
  const [parsedJson, setParsedJson] = useState<unknown>(null)
  const [showToast, setShowToast] = useState(false)
  const [fixLog, setFixLog] = useState<string[]>([])
  const [showFixMenu, setShowFixMenu] = useState(false)
  const [isCompressed, setIsCompressed] = useState(false)
  const [inputHistory, setInputHistory] = useState<Array<{ value: string; cursorPos: number }>>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [showOutputSearch, setShowOutputSearch] = useState(false)
  const [outputSearchQuery, setOutputSearchQuery] = useState('')
  const [outputSearchIndex, setOutputSearchIndex] = useState(-1)
  const [visibleSearchMatchCount, setVisibleSearchMatchCount] = useState(0)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const outputSearchInputRef = useRef<HTMLInputElement>(null)
  const outputScrollRef = useRef<HTMLDivElement>(null)

  const searchMatchCount = visibleSearchMatchCount
  const currentSearchPosition =
    outputSearchIndex >= 0 && searchMatchCount > 0 ? outputSearchIndex + 1 : 0
  const activeOutputSearchQuery = showOutputSearch ? outputSearchQuery : ''

  const getSearchMarks = useCallback(() => {
    const container = outputScrollRef.current
    if (!container) return []
    return Array.from(
      container.querySelectorAll<HTMLElement>('mark[data-json-search-match="true"]')
    )
  }, [])

  const goToSearchMatch = useCallback(
    (direction: 1 | -1) => {
      const marks = getSearchMarks()
      const count = marks.length
      setVisibleSearchMatchCount(count)
      setOutputSearchIndex((current) => getNextSearchIndex(current, count, direction))
      window.setTimeout(() => outputSearchInputRef.current?.focus({ preventScroll: true }), 0)
    },
    [getSearchMarks]
  )

  const updateInput = useCallback(
    (value: string, shouldMoveCursor = false, cursorPos = 0) => {
      setInput(value)
      setError('')

      setInputHistory((prev) => {
        const newHistory = historyIndex >= 0 ? prev.slice(0, historyIndex + 1) : prev
        const updated = [...newHistory, { value, cursorPos }].slice(-10)
        setHistoryIndex(updated.length - 1)
        return updated
      })

      try {
        if (value.trim()) {
          const parsed = parseJSON(value)
          setOutput(JSON.stringify(parsed, null, indent))
          setParsedJson(parsed)
          setIsCompressed(false)
        } else {
          setOutput('')
          setParsedJson(null)
          setIsCompressed(false)
        }
      } catch {
        // Keep typing quiet. Explicit format/repair actions surface parse errors.
      }

      if (shouldMoveCursor) {
        window.setTimeout(() => {
          if (!inputRef.current) return
          const length = inputRef.current.value.length
          inputRef.current.selectionStart = length
          inputRef.current.selectionEnd = length
          inputRef.current.focus()
        }, 0)
      }
    },
    [historyIndex, indent]
  )

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      const historyItem = inputHistory[newIndex]
      setHistoryIndex(newIndex)
      setInput(historyItem.value)
      setError('')
      window.setTimeout(() => {
        if (!inputRef.current) return
        inputRef.current.selectionStart = historyItem.cursorPos
        inputRef.current.selectionEnd = historyItem.cursorPos
        inputRef.current.focus()
      }, 0)
    }
  }, [historyIndex, inputHistory])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        const target = event.target as HTMLElement
        if (target.id === 'json-input') {
          event.preventDefault()
          handleUndo()
        }
      }

      if (event.key === 'Escape') {
        setShowOutputSearch(false)
        setShowFixMenu(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleUndo])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!showFixMenu) return
      const target = event.target as HTMLElement
      if (!target.closest('.json-fix-menu')) {
        setShowFixMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showFixMenu])

  useEffect(() => {
    if (!showOutputSearch) return
    const timer = window.setTimeout(() => {
      outputSearchInputRef.current?.focus({ preventScroll: true })
    }, 0)

    return () => window.clearTimeout(timer)
  }, [showOutputSearch])

  useEffect(() => {
    if (!showOutputSearch || !outputSearchQuery.trim()) {
      setVisibleSearchMatchCount(0)
      setOutputSearchIndex(-1)
      return
    }

    const timer = window.setTimeout(() => {
      const count = getSearchMarks().length
      setVisibleSearchMatchCount(count)
      setOutputSearchIndex((current) => {
        if (count === 0) return -1
        if (current < 0 || current >= count) return 0
        return current
      })
    }, 0)

    return () => window.clearTimeout(timer)
  }, [
    getSearchMarks,
    indent,
    isCompressed,
    output,
    outputSearchQuery,
    parsedJson,
    showOutputSearch,
  ])

  useEffect(() => {
    if (!showOutputSearch || !outputSearchQuery.trim()) return

    const timer = window.setTimeout(() => {
      const marks = getSearchMarks()
      marks.forEach((mark, index) => {
        mark.dataset.current = index === outputSearchIndex ? 'true' : 'false'
      })

      const container = outputScrollRef.current
      const activeMark = marks[outputSearchIndex]
      if (container && activeMark) {
        const containerRect = container.getBoundingClientRect()
        const activeRect = activeMark.getBoundingClientRect()
        container.scrollTo({
          top: getCenteredScrollOffset({
            scrollOffset: container.scrollTop,
            containerStart: containerRect.top,
            containerSize: container.clientHeight,
            targetStart: activeRect.top,
            targetSize: activeRect.height,
          }),
          left: getCenteredScrollOffset({
            scrollOffset: container.scrollLeft,
            containerStart: containerRect.left,
            containerSize: container.clientWidth,
            targetStart: activeRect.left,
            targetSize: activeRect.width,
          }),
          behavior: 'smooth',
        })
        outputSearchInputRef.current?.focus({ preventScroll: true })
      }
    }, 0)

    return () => window.clearTimeout(timer)
  }, [
    getSearchMarks,
    indent,
    isCompressed,
    output,
    outputSearchIndex,
    outputSearchQuery,
    parsedJson,
    showOutputSearch,
  ])

  useEffect(() => {
    if (!input.trim() || isCompressed) return

    try {
      const parsed = parseJSON(input)
      setOutput(JSON.stringify(parsed, null, indent))
      setParsedJson(parsed)
      setError('')
    } catch {
      // Ignore automatic reformat failures while the user edits.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indent])

  const showCopyToast = () => {
    setShowToast(true)
    window.setTimeout(() => setShowToast(false), 2000)
  }

  const handleFormat = () => {
    try {
      setError('')
      setFixLog([])
      const parsed = parseJSON(input)
      setOutput(JSON.stringify(parsed, null, indent))
      setParsedJson(parsed)
      setIsCompressed(false)
    } catch (err) {
      setError(`JSON 解析错误: ${err instanceof Error ? err.message : '未知错误'}`)
      setOutput('')
      setParsedJson(null)
      setIsCompressed(false)
    }
  }

  const handleCompress = () => {
    try {
      setError('')
      setFixLog([])
      const parsed = parseJSON(input)
      setOutput(JSON.stringify(parsed))
      setParsedJson(null)
      setIsCompressed(true)
    } catch (err) {
      setError(`JSON 解析错误: ${err instanceof Error ? err.message : '未知错误'}`)
      setOutput('')
      setParsedJson(null)
      setIsCompressed(false)
    }
  }

  const handleClear = () => {
    updateInput('', false, 0)
    setOutput('')
    setError('')
    setParsedJson(null)
    setFixLog([])
    setIsCompressed(false)
    setOutputSearchQuery('')
    setShowOutputSearch(false)
    inputRef.current?.focus()
  }

  const handleFix = (option: FixOption = 'all') => {
    try {
      setError('')
      setFixLog([])
      setShowFixMenu(false)

      const logs: string[] = []
      let text = input
      const originalLength = text.length
      const applyAll = option === 'all'

      if (applyAll || option === 'remove-bom') {
        const next = text.replace(/^\uFEFF/, '')
        if (next !== text) {
          logs.push('移除了 BOM 字符')
          text = next
        } else if (!applyAll) {
          logs.push('未检测到 BOM 字符')
        }
      }

      if (applyAll || option === 'trim-whitespace') {
        const next = text.trim()
        if (next !== text) {
          logs.push('移除了首尾空白字符')
          text = next
        } else if (!applyAll) {
          logs.push('无需移除首尾空白')
        }
      }

      if (applyAll || option === 'fix-escaped-json') {
        if (text.match(/^[{[]\\"/)) {
          logs.push('检测到裸露转义 JSON 格式')
          const beforeNewlineRemoval = text
          text = text.replace(/([^\\])\n/g, '$1')
          text = text.replace(/([^\\])\r\n/g, '$1')
          text = text.replace(/([^\\])\r/g, '$1')

          if (text !== beforeNewlineRemoval) {
            logs.push('移除了非法换行符')
          }

          const placeholder = '___BACKSLASH___'
          let unescaped = text.replace(/\\\\/g, placeholder)
          unescaped = unescaped.replace(/\\"/g, '"')
          unescaped = unescaped.replace(new RegExp(placeholder, 'g'), '\\')
          text = unescaped
          logs.push('将转义引号转换为正常引号')
        } else if (!applyAll) {
          logs.push('未检测到裸露转义 JSON 格式')
        }
      }

      if (applyAll || option === 'fix-newlines') {
        const beforeFix = text
        text = text.replace(/"([^"]*)\n([^"]*)":/g, '"$1$2":')
        const keyFixed = text !== beforeFix
        const beforeValueFix = text
        text = text.replace(/:\s*"([^"]*)\n([^"]*)"/g, ': "$1$2"')
        const valueFixed = text !== beforeValueFix

        if (keyFixed) logs.push('修复了键名中的换行符')
        if (valueFixed) logs.push('修复了字符串值中的换行符')
        if (!keyFixed && !valueFixed && !applyAll) logs.push('未检测到需要修复的换行符')
      }

      if (applyAll || option === 'normalize-newlines') {
        const beforeNormalize = text
        text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
        if (text !== beforeNormalize) {
          logs.push('标准化换行符为 LF')
        } else if (!applyAll) {
          logs.push('换行符已是标准格式')
        }
      }

      if (applyAll || option === 'remove-empty-lines') {
        const beforeWhitespace = text
        text = text.replace(/\n\s*\n\s*\n/g, '\n\n')
        if (text !== beforeWhitespace) {
          logs.push('移除了多余空行')
        } else if (!applyAll) {
          logs.push('未检测到多余空行')
        }
      }

      const parsed = parseJSON(text)
      logs.push('JSON 格式验证通过')

      const charReduced = originalLength - text.length
      if (charReduced > 0) {
        logs.push(`总共减少了 ${charReduced} 个字符`)
      } else if (charReduced < 0) {
        logs.push(`总共增加了 ${Math.abs(charReduced)} 个字符`)
      }

      updateInput(text, true, text.length)
      setOutput(JSON.stringify(parsed, null, indent))
      setParsedJson(parsed)
      setIsCompressed(false)
      setFixLog(logs)
    } catch (err) {
      setFixLog([])
      setError(`修复后仍有错误: ${err instanceof Error ? err.message : '未知错误'}`)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output)
      showCopyToast()
    } catch {
      setError('复制失败，请手动选择结果复制')
    }
  }

  const handleSample = () => {
    const sample = {
      name: '示例数据',
      age: 25,
      email: 'example@example.com',
      address: {
        city: '北京',
        country: '中国',
      },
      hobbies: ['阅读', '编程', '旅行'],
      active: true,
    }
    const value = JSON.stringify(sample)
    updateInput(value, true, value.length)
    setFixLog([])
  }

  const statusLabel = error
    ? '解析失败'
    : output
    ? isCompressed
      ? '已压缩'
      : '已格式化'
    : input.trim()
    ? '待格式化'
    : '空输入'

  const statusTone = error ? 'danger' : output ? 'success' : input.trim() ? 'info' : 'neutral'

  return (
    <ToolWorkbench
      title="JSON 格式化工具"
      description="格式化、压缩、修复和检查 JSON 数据，支持树形结果、节点复制和结果搜索。"
      statusLabel={statusLabel}
      statusTone={statusTone}
      toolbar={
        <>
          <ToolButton variant="primary" onClick={handleFormat}>
            格式化
          </ToolButton>
          <ToolButton variant="secondary" onClick={handleCompress}>
            压缩
          </ToolButton>
          <div className="json-fix-menu relative">
            <div className="flex">
              <ToolButton
                variant="warning"
                onClick={() => handleFix('all')}
                className="rounded-r-none"
              >
                修复格式
              </ToolButton>
              <ToolButton
                variant="warning"
                onClick={() => setShowFixMenu(!showFixMenu)}
                className="rounded-l-none border-l-amber-400 px-2"
                aria-label="打开修复选项"
              >
                v
              </ToolButton>
            </div>
            {showFixMenu && (
              <div className="absolute top-full left-0 z-20 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-gray-200 bg-white p-1 shadow-xl dark:border-gray-800 dark:bg-gray-900">
                {FIX_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleFix(option.value)}
                    className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <span className="font-semibold text-gray-950 dark:text-gray-50">
                      {option.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
                      {option.description}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <ToolButton variant="muted" onClick={handleClear}>
            清空
          </ToolButton>
          <ToolButton variant="muted" onClick={handleSample}>
            示例数据
          </ToolButton>
          <ToolButton variant="success" onClick={handleCopy} disabled={!output}>
            复制结果
          </ToolButton>
          <div className="ml-0 flex items-center gap-2 lg:ml-auto">
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">
              缩进
              <select
                value={indent}
                onChange={(event) => setIndent(Number(event.target.value))}
                className="ml-2 min-h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
              >
                <option value={2}>2</option>
                <option value={4}>4</option>
                <option value={8}>8</option>
              </select>
            </label>
          </div>
        </>
      }
      feedback={
        <>
          {error && (
            <ToolNotice tone="danger" title="JSON 错误">
              {error}
            </ToolNotice>
          )}
          {fixLog.length > 0 && (
            <ToolNotice tone="info" title="修复操作日志">
              <ul className="grid gap-1 md:grid-cols-2">
                {fixLog.map((log, index) => (
                  <li key={index}>{log}</li>
                ))}
              </ul>
            </ToolNotice>
          )}
        </>
      }
    >
      <ToolPanel title="输入 JSON" meta={formatMeta(input)}>
        <div
          className={`flex ${formatterPaneHeightClass} overflow-hidden bg-white dark:bg-gray-950`}
        >
          <LineNumbers text={input} />
          <textarea
            ref={inputRef}
            id="json-input"
            value={input}
            onChange={(event) => {
              const textarea = event.target
              updateInput(textarea.value, false, textarea.selectionStart)
            }}
            placeholder="在此粘贴或输入 JSON 数据..."
            className="h-full flex-1 resize-none overflow-auto bg-transparent p-4 font-mono text-sm leading-6 text-gray-900 focus:outline-none dark:text-gray-100"
            spellCheck={false}
          />
        </div>
      </ToolPanel>

      <ToolPanel
        title={isCompressed ? '压缩结果' : '格式化结果'}
        meta={output ? formatMeta(output) : '等待输入'}
        actions={
          <>
            <ToolButton
              variant={showOutputSearch ? 'primary' : 'secondary'}
              onClick={() => setShowOutputSearch(!showOutputSearch)}
              disabled={!output}
            >
              搜索
            </ToolButton>
            <ToolButton variant="secondary" onClick={handleCopy} disabled={!output}>
              复制
            </ToolButton>
          </>
        }
        className="xl:col-span-1"
      >
        <div className={`flex ${formatterPaneHeightClass} flex-col bg-white dark:bg-gray-950`}>
          {showOutputSearch && (
            <div className="shrink-0 border-b border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={outputSearchInputRef}
                  type="search"
                  value={outputSearchQuery}
                  onChange={(event) => {
                    setOutputSearchQuery(event.target.value)
                    setOutputSearchIndex(-1)
                  }}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter') return
                    event.preventDefault()
                    goToSearchMatch(event.shiftKey ? -1 : 1)
                  }}
                  placeholder="搜索输出..."
                  className="min-h-10 min-w-0 flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none sm:min-w-64 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {outputSearchQuery.trim()
                    ? `${currentSearchPosition} / ${searchMatchCount}`
                    : '输入关键词开始搜索'}
                </span>
                <button
                  type="button"
                  className={searchNavButtonClass}
                  onClick={() => goToSearchMatch(-1)}
                  disabled={searchMatchCount === 0}
                >
                  上一个
                </button>
                <button
                  type="button"
                  className={searchNavButtonClass}
                  onClick={() => goToSearchMatch(1)}
                  disabled={searchMatchCount === 0}
                >
                  下一个
                </button>
                <button
                  type="button"
                  className={searchNavButtonClass}
                  onClick={() => {
                    setOutputSearchQuery('')
                    setOutputSearchIndex(-1)
                  }}
                  disabled={!outputSearchQuery}
                >
                  清除
                </button>
              </div>
            </div>
          )}

          {output || parsedJson ? (
            <div ref={outputScrollRef} className="min-h-0 flex-1 overflow-auto">
              <div className="flex min-h-full">
                {output && <LineNumbers text={output} />}
                <div className="min-w-0 flex-1">
                  {isCompressed && output ? (
                    <pre className="min-w-max p-4 font-mono text-sm leading-6 whitespace-pre text-gray-900 dark:text-gray-100">
                      {renderHighlightedText(output, activeOutputSearchQuery)}
                    </pre>
                  ) : parsedJson ? (
                    <div className="min-w-max p-4">
                      {output.length > 50000 && (
                        <ToolNotice tone="info">
                          数据量较大，建议使用压缩模式查看或搜索以获得更好的性能。
                        </ToolNotice>
                      )}
                      <JsonNode
                        data={parsedJson}
                        indent={indent}
                        onCopySuccess={showCopyToast}
                        searchQuery={activeOutputSearchQuery}
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 items-center justify-center p-8 text-sm text-gray-500 dark:text-gray-400">
              格式化后的 JSON 将显示在这里
            </div>
          )}
        </div>
      </ToolPanel>

      {showToast && (
        <div className="fixed right-6 bottom-6 z-50 rounded-lg border border-emerald-500 bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg">
          复制成功
        </div>
      )}
    </ToolWorkbench>
  )
}

'use client'

import { useState, useRef, useEffect, useCallback, memo } from 'react'
import { genPageMetadata } from 'app/seo'

// 修复选项类型
type FixOption =
  | 'all' // 全部修复
  | 'remove-bom' // 移除 BOM
  | 'trim-whitespace' // 移除首尾空白
  | 'fix-escaped-json' // 修复转义 JSON
  | 'fix-newlines' // 修复换行符
  | 'normalize-newlines' // 标准化换行符
  | 'remove-empty-lines' // 移除多余空行

// 修复选项描述
const FIX_OPTIONS: { value: FixOption; label: string; description: string }[] = [
  { value: 'all', label: '🔧 全部修复', description: '执行所有修复操作' },
  { value: 'remove-bom', label: '移除 BOM 字符', description: '删除文件开头的 BOM 标记' },
  {
    value: 'trim-whitespace',
    label: '移除首尾空白',
    description: '删除 JSON 字符串首尾的空格和换行',
  },
  {
    value: 'fix-escaped-json',
    label: '修复转义 JSON',
    description: '处理裸露转义格式（如 {\\"key\\":\\"value\\"}）',
  },
  {
    value: 'fix-newlines',
    label: '修复换行符错误',
    description: '移除键名和值中的非法换行符',
  },
  {
    value: 'normalize-newlines',
    label: '标准化换行符',
    description: '将 \\r\\n 和 \\r 统一为 \\n',
  },
  {
    value: 'remove-empty-lines',
    label: '移除多余空行',
    description: '删除连续超过2个的空行',
  },
]

// 高亮文本组件
interface HighlightTextProps {
  text: string
  searchQuery: string
}

const HighlightText = memo(function HighlightText({ text, searchQuery }: HighlightTextProps) {
  if (!searchQuery) {
    return <span>{text}</span>
  }

  const lowerText = text.toLowerCase()
  const lowerQuery = searchQuery.toLowerCase()
  const matches: { start: number; end: number }[] = []

  let index = 0
  while ((index = lowerText.indexOf(lowerQuery, index)) !== -1) {
    matches.push({ start: index, end: index + searchQuery.length })
    index += 1
  }

  if (matches.length === 0) {
    return <span>{text}</span>
  }

  const parts: React.ReactNode[] = []
  let lastIndex = 0

  matches.forEach((match, i) => {
    parts.push(text.substring(lastIndex, match.start))

    parts.push(
      <mark
        key={`match-${i}`}
        className="bg-yellow-300 dark:bg-yellow-600 text-gray-900 dark:text-gray-100"
      >
        {text.substring(match.start, match.end)}
      </mark>
    )
    lastIndex = match.end
  })

  parts.push(text.substring(lastIndex))
  return <span>{parts}</span>
})

// JSON 节点组件 - 用于递归显示 JSON 树 (使用 memo 优化)
interface JsonNodeProps {
  data: unknown
  keyName?: string
  level?: number
  indent?: number
  onCopySuccess?: () => void
  searchQuery?: string
  searchIndex?: number
}

const JsonNode = memo(function JsonNode({ data, keyName, level = 0, indent = 2, onCopySuccess, searchQuery = '', searchIndex = -1 }: JsonNodeProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [showCopy, setShowCopy] = useState(false)
  const isObject = typeof data === 'object' && data !== null && !Array.isArray(data)
  const isArray = Array.isArray(data)
  const isCollapsible = isObject || isArray

  const indentPx = level * (indent * 12) // 每个缩进空格对应12px

  // 复制当前节点的 JSON 数据
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const jsonString = JSON.stringify(data, null, indent)
      await navigator.clipboard.writeText(jsonString)
      onCopySuccess?.()
    } catch (err) {
      alert('复制失败')
    }
  }

  // 复制单个 key-value
  const handleCopyKeyValue = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const kvString = keyName
        ? `"${keyName}": ${JSON.stringify(data, null, indent)}`
        : JSON.stringify(data, null, indent)
      await navigator.clipboard.writeText(kvString)
      onCopySuccess?.()
    } catch (err) {
      alert('复制失败')
    }
  }

  if (!isCollapsible) {
    // 基本类型值
    const valueColor =
      typeof data === 'string'
        ? 'text-green-600 dark:text-green-400'
        : typeof data === 'number'
          ? 'text-blue-600 dark:text-blue-400'
          : typeof data === 'boolean'
            ? 'text-orange-600 dark:text-orange-400'
            : data === null
              ? 'text-gray-500 dark:text-gray-400'
              : 'text-gray-600 dark:text-gray-400'

    return (
      <div
        style={{ paddingLeft: `${indentPx}px` }}
        className="group relative rounded py-0.5 font-mono text-sm leading-6 hover:bg-gray-100 dark:hover:bg-gray-800"
        onMouseEnter={() => setShowCopy(true)}
        onMouseLeave={() => setShowCopy(false)}
      >
        <div className="flex items-center">
          <div className="flex-1">
            {keyName && (
              <span className="font-medium text-red-600 dark:text-red-400">
                <HighlightText text={`"${keyName}"`} searchQuery={searchQuery} />
              </span>
            )}
            {keyName && <span className="text-gray-500 dark:text-gray-400">: </span>}
            <span className={valueColor}>
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
              className="hover:text-primary-500 dark:hover:text-primary-400 ml-2 text-xs text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 dark:text-gray-500"
              title="复制此键值对"
            >
              📋
            </button>
          )}
        </div>
      </div>
    )
  }

  // 对象或数组
  const entries = isArray ? data : Object.entries(data)
  const openBracket = isArray ? '[' : '{'
  const closeBracket = isArray ? ']' : '}'
  const itemCount = isArray ? data.length : Object.keys(data).length

  return (
    <div className="font-mono text-sm">
      <div
        style={{ paddingLeft: `${indentPx}px` }}
        className="group relative rounded py-0.5 leading-6 hover:bg-gray-100 dark:hover:bg-gray-800"
        onMouseEnter={() => setShowCopy(true)}
        onMouseLeave={() => setShowCopy(false)}
      >
        <div className="flex items-center">
          <div className="flex-1">
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
              className="inline-flex items-center rounded px-1 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
              title={collapsed ? '展开' : '折叠'}
            >
              <span className="mr-1 text-xs text-gray-400 select-none dark:text-gray-500">
                {collapsed ? '▶' : '▼'}
              </span>
              <span className="font-bold text-gray-700 dark:text-gray-300">
                <HighlightText text={openBracket} searchQuery={searchQuery} />
              </span>
            </button>
            {collapsed && (
              <>
                <span className="ml-2 text-xs text-gray-400 italic dark:text-gray-500">
                  <HighlightText text={`${itemCount} ${isArray ? (itemCount === 1 ? 'item' : 'items') : (itemCount === 1 ? 'key' : 'keys')}`} searchQuery={searchQuery} />
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
              className="hover:text-primary-500 dark:hover:text-primary-400 ml-2 text-xs text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 dark:text-gray-500"
              title="复制此节点"
            >
              📋
            </button>
          )}
        </div>
      </div>
      {!collapsed && (
        <>
          {isArray
            ? (data as unknown[]).map((item: unknown, index: number) => (
                <JsonNode
                  key={index}
                  data={item}
                  level={level + 1}
                  indent={indent}
                  onCopySuccess={onCopySuccess}
                  searchQuery={searchQuery}
                  searchIndex={searchIndex}
                />
              ))
            : entries.map(([key, value]: [string, unknown]) => (
                <JsonNode
                  key={key}
                  keyName={key}
                  data={value}
                  level={level + 1}
                  indent={indent}
                  onCopySuccess={onCopySuccess}
                  searchQuery={searchQuery}
                  searchIndex={searchIndex}
                />
              ))}
          <div
            style={{ paddingLeft: `${indentPx}px` }}
            className="rounded py-0.5 leading-6 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <span className="font-bold text-gray-700 dark:text-gray-300">{closeBracket}</span>
            {level > 0 && <span className="text-gray-400 dark:text-gray-500">,</span>}
          </div>
        </>
      )}
    </div>
  )
})

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
  const [inputHistory, setInputHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [showOutputSearch, setShowOutputSearch] = useState(false)
  const [outputSearchQuery, setOutputSearchQuery] = useState('')
  const [outputSearchIndex, setOutputSearchIndex] = useState(-1)
  const [isProcessing, setIsProcessing] = useState(false) // 处理中状态
  const [processProgress, setProcessProgress] = useState(0) // 处理进度 0-100
  const [isOutputSelected, setIsOutputSelected] = useState(false) // 输出框是否被选中
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const outputRef = useRef<HTMLDivElement>(null)
  const outputContentRef = useRef<HTMLDivElement>(null) // 输出框内容区域（可滚动）
  const inputSearchRef = useRef<HTMLInputElement>(null)
  const outputSearchRef = useRef<HTMLInputElement>(null)
  const inputContainerRef = useRef<HTMLDivElement>(null)
  const outputContainerRef = useRef<HTMLDivElement>(null)

  // 带历史记录的输入更新 - 自动格式化
  const updateInput = useCallback((value: string) => {
    setInput(value)
    setError('')
    setIsProcessing(true)
    setProcessProgress(0)

    // 添加历史记录
    setInputHistory((prev) => {
      const newHistory = historyIndex >= 0 ? prev.slice(0, historyIndex + 1) : prev
      const updated = [...newHistory, value].slice(-10)
      setHistoryIndex(updated.length - 1)
      return updated
    })

    // 立即执行格式化
    try {
      if (value.trim()) {
        setProcessProgress(25)
        const processedText = preprocessJSON(value)
        setProcessProgress(50)
        
        let parsed = JSON.parse(processedText)
        setProcessProgress(65)

        if (typeof parsed === 'string') {
          try {
            parsed = JSON.parse(preprocessJSON(parsed))
          } catch {
            // 忽略第二次解析失败
          }
        }

        setProcessProgress(80)
        const formatted = JSON.stringify(parsed, null, indent)
        setProcessProgress(95)
        
        setOutput(formatted)
        setParsedJson(parsed)
        setIsCompressed(false)
      } else {
        setOutput('')
        setParsedJson(null)
        setIsCompressed(false)
      }
    } catch {
      // 解析失败不显示错误
    } finally {
      setProcessProgress(100)
      setTimeout(() => {
        setIsProcessing(false)
        setProcessProgress(0)
      }, 300)
    }
  }, [historyIndex, indent])

  // 撤销操作（Ctrl+Z）
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      setInput(inputHistory[newIndex])
      setError('') // 撤销时清除错误
    }
  }, [historyIndex, inputHistory])

  // 当输入改变时，将光标移到末尾
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.selectionStart = input.length
      inputRef.current.selectionEnd = input.length
    }
  }, [input])

  // 显示复制成功的浮窗提示
  const showCopyToast = () => {
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2000)
  }

  // 计算匹配位置（带去抖）
  const calculateMatches = (text: string, query: string): number[] => {
    if (!query.trim() || text.length === 0) return []
    const matches: number[] = []
    const lowerText = text.toLowerCase()
    const lowerQuery = query.toLowerCase()
    let index = 0
    while ((index = lowerText.indexOf(lowerQuery, index)) !== -1) {
      matches.push(index)
      index += 1 // 每次往前推1个位置，支持重叠匹配
    }
    return matches
  }

  // 处理输出框搜索
  const handleOutputSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const matches = calculateMatches(output, outputSearchQuery)
      if (matches.length > 0) {
        setOutputSearchIndex((prev) => {
          const nextIndex = prev < 0 ? 0 : (prev + 1) % matches.length
          return nextIndex
        })
      }
    }
  }

  // 处理 Ctrl+F 快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        // 当输出框被选中或搜索框已打开时，阻止默认行为
        if (isOutputSelected || showOutputSearch) {
          e.preventDefault()
          setShowOutputSearch(true)
          setTimeout(() => outputSearchRef.current?.focus(), 0)
        }
        // 其他地方允许浏览器默认搜索
      }

      // Escape 关闭搜索框
      if (e.key === 'Escape') {
        if (showOutputSearch) {
          setShowOutputSearch(false)
          setOutputSearchQuery('')
          setOutputSearchIndex(-1)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showOutputSearch, isOutputSelected])

  // 监听键盘事件 (Ctrl+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        const target = e.target as HTMLElement
        // 只在输入框内响应
        if (target.id === 'input') {
          e.preventDefault()
          handleUndo()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleUndo])

  // 处理输出框选中状态：点击输出框时选中，点击其他地方时取消选中
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOutputSelected) {
        const target = event.target as HTMLElement
        // 检查点击是否在输出框容器外部
        if (outputContainerRef.current && !outputContainerRef.current.contains(target)) {
          setIsOutputSelected(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOutputSelected])

  // 点击外部关闭修复菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showFixMenu) {
        const target = event.target as HTMLElement
        // 检查点击是否在菜单外部
        const menu = document.querySelector('.fix-menu-container')
        if (menu && !menu.contains(target)) {
          setShowFixMenu(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showFixMenu])

  // 搜索结果自动滚动到视图中
  useEffect(() => {
    if (outputSearchIndex >= 0 && outputSearchQuery && outputContentRef.current) {
      // 使用 setTimeout 确保 DOM 更新完成
      const timer = setTimeout(() => {
        const container = outputContentRef.current!
        const allMarks = container.querySelectorAll('mark') as NodeListOf<HTMLElement>

        if (allMarks && allMarks.length > outputSearchIndex) {
          const currentMatch = allMarks[outputSearchIndex]

          if (currentMatch) {
            // 使用 scrollIntoView 让元素居中显示
            currentMatch.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
              inline: 'nearest'
            })
          }
        }
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [outputSearchIndex, outputSearchQuery])

  // 当搜索查询变化时，自动跳转到第一个匹配项
  useEffect(() => {
    if (outputSearchQuery && outputContentRef.current) {
      const timer = setTimeout(() => {
        const container = outputContentRef.current!
        const allMarks = container.querySelectorAll('mark') as NodeListOf<HTMLElement>
        setOutputSearchIndex(allMarks.length > 0 ? 0 : -1)
      }, 100)

      return () => clearTimeout(timer)
    } else {
      setOutputSearchIndex(-1)
    }
  }, [outputSearchQuery])

  // 预处理 JSON 字符串，修复常见格式问题
  const preprocessJSON = (text: string): string => {
    // 移除所有 BOM 字符
    text = text.replace(/^\uFEFF/, '')
    text = text.trim()

    // 检测是否是"裸露"的转义 JSON（以 {\" 或 [\" 开头但没有外层引号）
    // 这种情况下，JSON的引号被转义了但整体不是字符串
    if (text.match(/^[{[]\\"/)) {
      // 移除转义 JSON 中间的非转义换行符
      text = text.replace(/([^\\])\n/g, '$1')
      text = text.replace(/([^\\])\r\n/g, '$1')
      text = text.replace(/([^\\])\r/g, '$1')

      // 尝试反转义：将 \" 替换为 "
      // 先保护 \\ ，避免和 \" 混淆
      const BACKSLASH_PLACEHOLDER = '___BACKSLASH___'
      let unescaped = text.replace(/\\\\/g, BACKSLASH_PLACEHOLDER) // 临时占位符
      unescaped = unescaped.replace(/\\"/g, '"') // 将 \" 替换为 "
      unescaped = unescaped.replace(new RegExp(BACKSLASH_PLACEHOLDER, 'g'), '\\') // 恢复反斜杠

      // 验证反转义后是否是有效的 JSON
      try {
        JSON.parse(unescaped)
        return unescaped
      } catch {
        // 如果反转义后仍然无效，返回原文本
        return text
      }
    }

    return text
  }

  // 解析 JSON，支持转义的 JSON 字符串
  const parseJSON = (text: string) => {
    // 预处理输入
    text = preprocessJSON(text)

    let parsed = JSON.parse(text)

    // 如果解析结果是字符串，尝试再次解析（处理转义的 JSON）
    if (typeof parsed === 'string') {
      try {
        // 再次预处理（因为解析后可能还有换行问题）
        parsed = JSON.parse(preprocessJSON(parsed))
      } catch {
        // 如果第二次解析失败，返回第一次解析的结果
        return parsed
      }
    }

    return parsed
  }

  const handleFormat = () => {
    try {
      setIsProcessing(true)
      setProcessProgress(20)
      setError('')
      setFixLog([])
      setProcessProgress(40)
      const parsed = parseJSON(input)
      setProcessProgress(70)
      const formatted = JSON.stringify(parsed, null, indent)
      setProcessProgress(90)
      setOutput(formatted)
      setParsedJson(parsed)
      setIsCompressed(false)
      setProcessProgress(100)
    } catch (err) {
      setError(`JSON 解析错误: ${err instanceof Error ? err.message : '未知错误'}`)
      setOutput('')
      setParsedJson(null)
      setIsCompressed(false)
      setProcessProgress(100)
    } finally {
      setTimeout(() => {
        setIsProcessing(false)
        setProcessProgress(0)
      }, 300)
    }
  }

  const handleCompress = () => {
    try {
      setIsProcessing(true)
      setProcessProgress(20)
      setError('')
      setFixLog([])
      setProcessProgress(40)
      const parsed = parseJSON(input)
      setProcessProgress(70)
      const compressed = JSON.stringify(parsed)
      setProcessProgress(90)
      setOutput(compressed)
      setParsedJson(null)
      setIsCompressed(true)
      setProcessProgress(100)
    } catch (err) {
      setError(`JSON 解析错误: ${err instanceof Error ? err.message : '未知错误'}`)
      setOutput('')
      setParsedJson(null)
      setIsCompressed(false)
      setProcessProgress(100)
    } finally {
      setTimeout(() => {
        setIsProcessing(false)
        setProcessProgress(0)
      }, 300)
    }
  }

  const handleClear = () => {
    updateInput('')
    setOutput('')
    setError('')
    setParsedJson(null)
    setFixLog([])
    setIsCompressed(false)
    setShowOutputSearch(false)
    setOutputSearchQuery('')
    setOutputSearchIndex(-1)
    setIsProcessing(false)
    setProcessProgress(0)
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

      // 1. 移除 BOM 字符
      if (applyAll || option === 'remove-bom') {
        const bomRemoved = text.replace(/^\uFEFF/, '')
        if (bomRemoved !== text) {
          logs.push('✓ 移除了 BOM (Byte Order Mark) 字符')
          text = bomRemoved
        } else if (!applyAll) {
          logs.push('ℹ️ 未检测到 BOM 字符')
        }
      }

      // 2. 移除首尾空白
      if (applyAll || option === 'trim-whitespace') {
        const trimmed = text.trim()
        if (trimmed !== text) {
          logs.push('✓ 移除了首尾空白字符')
          text = trimmed
        } else if (!applyAll) {
          logs.push('ℹ️ 无需移除首尾空白')
        }
      }

      // 3. 检测裸露转义 JSON
      if (applyAll || option === 'fix-escaped-json') {
        if (text.match(/^[{[]\\"/)) {
          logs.push('✓ 检测到裸露转义 JSON 格式（引号被转义但无外层包裹）')

          // 移除转义 JSON 中间的非转义换行符
          const beforeNewlineRemoval = text
          text = text.replace(/([^\\])\n/g, '$1')
          text = text.replace(/([^\\])\r\n/g, '$1')
          text = text.replace(/([^\\])\r/g, '$1')

          if (text !== beforeNewlineRemoval) {
            const removedCount = (beforeNewlineRemoval.match(/\n|\r\n|\r/g) || []).length
            logs.push(`✓ 移除了 ${removedCount} 个非法换行符`)
          }

          // 反转义处理
          const BACKSLASH_PLACEHOLDER = '___BACKSLASH___'
          let unescaped = text.replace(/\\\\/g, BACKSLASH_PLACEHOLDER)
          unescaped = unescaped.replace(/\\"/g, '"')
          unescaped = unescaped.replace(new RegExp(BACKSLASH_PLACEHOLDER, 'g'), '\\')

          text = unescaped
          logs.push('✓ 将转义的引号转换为正常引号')
        } else if (!applyAll) {
          logs.push('ℹ️ 未检测到裸露转义 JSON 格式')
        }
      }

      // 4. 修复换行符导致的 JSON 错误
      if (applyAll || option === 'fix-newlines') {
        const beforeFix = text

        // 移除键名中间的换行
        text = text.replace(/"([^"]*)\n([^"]*)":/g, '"$1$2":')
        const keyFixed = text !== beforeFix

        // 移除字符串值中间的非转义换行
        const beforeValueFix = text
        text = text.replace(/:\s*"([^"]*)\n([^"]*)"/g, ': "$1$2"')
        const valueFixed = text !== beforeValueFix

        if (keyFixed) {
          logs.push('✓ 修复了键名中的换行符')
        }
        if (valueFixed) {
          logs.push('✓ 修复了字符串值中的换行符')
        }
        if (!keyFixed && !valueFixed && !applyAll) {
          logs.push('ℹ️ 未检测到需要修复的换行符')
        }
      }

      // 5. 标准化换行符（统一为 \n）
      if (applyAll || option === 'normalize-newlines') {
        const beforeNormalize = text
        text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
        if (text !== beforeNormalize) {
          logs.push('✓ 标准化换行符为 LF (\\n)')
        } else if (!applyAll) {
          logs.push('ℹ️ 换行符已是标准格式')
        }
      }

      // 6. 移除多余的空白（保持结构）
      if (applyAll || option === 'remove-empty-lines') {
        const beforeWhitespace = text
        text = text.replace(/\n\s*\n\s*\n/g, '\n\n') // 最多保留两个连续换行
        if (text !== beforeWhitespace) {
          logs.push('✓ 移除了多余的空行')
        } else if (!applyAll) {
          logs.push('ℹ️ 未检测到多余的空行')
        }
      }

      // 验证修复结果
      try {
        JSON.parse(text)
        logs.push('✅ JSON 格式验证通过！')

        // 统计信息
        const charReduced = originalLength - text.length
        if (charReduced > 0) {
          logs.push(`📊 总共减少了 ${charReduced} 个字符`)
        } else if (charReduced < 0) {
          logs.push(`📊 总共增加了 ${Math.abs(charReduced)} 个字符`)
        } else if (logs.length === 1) {
          // 只有验证通过，没有其他操作
          logs.push('📊 字符数量未变化')
        }

        updateInput(text)
        setFixLog(logs)
        setError('')
      } catch (parseErr) {
        logs.push(
          `❌ 修复后仍无法解析: ${parseErr instanceof Error ? parseErr.message : '未知错误'}`
        )
        setFixLog(logs)
        setError(`修复后仍有错误: ${parseErr instanceof Error ? parseErr.message : '未知错误'}`)
      }
    } catch (err) {
      setError(`修复过程出错: ${err instanceof Error ? err.message : '未知错误'}`)
      setFixLog([])
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output)
      showCopyToast()
    } catch (err) {
      alert('复制失败，请手动复制')
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
    updateInput(JSON.stringify(sample))
    setFixLog([])
  }

  return (
    <div className="relative right-1/2 left-1/2 -mr-[50vw] -ml-[50vw] w-screen">
      {/* 原生进度条 */}
      {isProcessing && (
        <progress 
          value={processProgress} 
          max={100}
          className="fixed top-0 left-0 w-full h-1 bg-gray-200 dark:bg-gray-700"
          style={{
            appearance: 'none',
            WebkitAppearance: 'none',
          }}
        />
      )}
      <style>{`
        progress {
          width: 100%;
          height: 4px;
          appearance: none;
          -webkit-appearance: none;
          border: none;
          background-color: transparent;
        }
        progress::-webkit-progress-bar {
          background-color: transparent;
        }
        progress::-webkit-progress-value {
          background: linear-gradient(90deg, #3b82f6, #06b6d4);
          transition: width 0.3s ease;
        }
        progress::-moz-progress-bar {
          background: linear-gradient(90deg, #3b82f6, #06b6d4);
          transition: width 0.3s ease;
        }
        /* 输入框滚动条样式 */
        textarea::-webkit-scrollbar {
          width: 8px;
        }
        textarea::-webkit-scrollbar-track {
          background: #f3f4f6;
        }
        textarea::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 4px;
          transition: background 0.3s ease;
        }
        textarea::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
        textarea::-webkit-scrollbar-thumb:active {
          background: #6b7280;
        }
        /* 深色模式滚动条 */
        @media (prefers-color-scheme: dark) {
          textarea::-webkit-scrollbar-track {
            background: #111827;
          }
          textarea::-webkit-scrollbar-thumb {
            background: #4b5563;
          }
          textarea::-webkit-scrollbar-thumb:hover {
            background: #6b7280;
          }
          textarea::-webkit-scrollbar-thumb:active {
            background: #9ca3af;
          }
        }
        /* Firefox 滚动条 */
        textarea {
          scrollbar-color: #d1d5db #f3f4f6;
          scrollbar-width: thin;
        }
        @media (prefers-color-scheme: dark) {
          textarea {
            scrollbar-color: #4b5563 #111827;
          }
        }
      `}</style>
      <div className="mx-auto max-w-[95vw] px-4 sm:px-6 lg:px-8">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          <div className="space-y-2 pt-6 pb-6 md:space-y-3">
            <h1 className="text-3xl leading-9 font-extrabold tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:text-5xl md:leading-14 dark:text-gray-100">
              JSON 格式化工具
            </h1>
            <p className="text-base leading-7 text-gray-500 dark:text-gray-400">
              在线 JSON 格式化、压缩、验证工具
            </p>
          </div>

          <div className="py-6">
            <div className="space-y-4">
              {/* 控制面板 */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleFormat}
                  className="bg-primary-500 hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700 rounded-md px-4 py-2 text-white transition-colors"
                >
                  格式化
                </button>
                <button
                  onClick={handleCompress}
                  className="bg-primary-500 hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700 rounded-md px-4 py-2 text-white transition-colors"
                >
                  压缩
                </button>
                {/* 修复格式按钮组 - 带下拉菜单 */}
                <div className="fix-menu-container relative">
                  <div className="flex">
                    <button
                      onClick={() => handleFix('all')}
                      className="rounded-l-md bg-yellow-500 px-4 py-2 text-white transition-colors hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700"
                    >
                      修复格式
                    </button>
                    <button
                      onClick={() => setShowFixMenu(!showFixMenu)}
                      className="rounded-r-md border-l border-yellow-400 bg-yellow-500 px-2 py-2 text-white transition-colors hover:bg-yellow-600 dark:border-yellow-500 dark:bg-yellow-600 dark:hover:bg-yellow-700"
                      aria-label="修复选项"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-5 w-5"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* 下拉菜单 */}
                  {showFixMenu && (
                    <div className="absolute top-full left-0 z-10 mt-1 w-80 rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                      <div className="py-1">
                        {FIX_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => handleFix(opt.value)}
                            className="w-full px-4 py-2 text-left text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {opt.label}
                            </div>
                            <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                              {opt.description}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleClear}
                  className="rounded-md bg-gray-500 px-4 py-2 text-white transition-colors hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700"
                >
                  清空
                </button>
                <button
                  onClick={handleSample}
                  className="rounded-md bg-gray-500 px-4 py-2 text-white transition-colors hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700"
                >
                  示例数据
                </button>
                {output && (
                  <button
                    onClick={handleCopy}
                    className="rounded-md bg-green-500 px-4 py-2 text-white transition-colors hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700"
                  >
                    复制结果
                  </button>
                )}
                <div className="flex items-center gap-2">
                  <label htmlFor="indent" className="text-sm text-gray-700 dark:text-gray-300">
                    缩进空格:
                  </label>
                  <select
                    id="indent"
                    value={indent}
                    onChange={(e) => setIndent(Number(e.target.value))}
                    className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                  >
                    <option value={2}>2</option>
                    <option value={4}>4</option>
                    <option value={8}>8</option>
                  </select>
                </div>
              </div>

              {/* 错误提示 */}
              {error && (
                <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 修复日志 */}
              {fixLog.length > 0 && (
                <div className="rounded-md bg-blue-50 p-4 dark:bg-blue-900/20">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-blue-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1">
                      <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                        修复操作日志
                      </h3>
                      <div className="mt-2 space-y-1">
                        {fixLog.map((log, index) => (
                          <p key={index} className="text-sm text-blue-700 dark:text-blue-400">
                            {log}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 输入输出区域 */}
              <div className="grid gap-4 lg:grid-cols-3">
                {/* 输入框 - 带行号 */}
                <div className="flex flex-col lg:col-span-1" ref={inputContainerRef}>
                  <label
                    htmlFor="input"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    输入 JSON
                  </label>
                  <div className="flex rounded-md border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800 overflow-hidden h-[1000px]">
                    {/* 行号容器 */}
                    <div 
                      className="flex-shrink-0 border-r border-gray-300 bg-gray-50 px-2 py-4 text-right dark:border-gray-600 dark:bg-gray-900 overflow-hidden"
                      style={{
                        maxHeight: '1000px',
                        lineHeight: '1.5rem',
                      }}
                    >
                      {input.split('\n').map((_, i) => (
                        <div
                          key={i}
                          className="font-mono text-2xs text-gray-400 dark:text-gray-500"
                          style={{ height: '1.5rem' }}
                        >
                          {i + 1}
                        </div>
                      ))}
                    </div>
                    {/* 文本输入 - 带滚动条 */}
                    <textarea
                      ref={inputRef}
                      id="input"
                      value={input}
                      onChange={(e) => updateInput(e.target.value)}
                      onScroll={(e) => {
                        // 同步行号滚动
                        const lineNoDiv = e.currentTarget.previousElementSibling as HTMLElement
                        if (lineNoDiv) {
                          lineNoDiv.scrollTop = e.currentTarget.scrollTop
                        }
                      }}
                      placeholder="在此粘贴或输入 JSON 数据... (点击后按 Ctrl+F 搜索)"
                      className="flex-1 resize-none overflow-y-scroll bg-transparent p-4 font-mono text-xs text-gray-900 focus:outline-none dark:text-gray-100"
                      spellCheck={false}
                      style={{ 
                        lineHeight: '1.5rem',
                        maxHeight: '1000px',
                      }}
                    />
                  </div>
                </div>

                {/* 输出框 - 带行号和内容 */}
                <div 
                  className="flex flex-col lg:col-span-2" 
                  ref={outputContainerRef}
                  onClick={() => setIsOutputSelected(true)}
                >
                  <label
                    htmlFor="output"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    {isCompressed ? '压缩结果' : '格式化结果（点击 ▶ ▼ 折叠/展开）'}
                  </label>
                  {/* 搜索框 - 悬浮固定 */}
                  {showOutputSearch && (
                    <div className="fixed z-50 rounded-md border border-blue-400 bg-white p-2 shadow-lg dark:border-blue-500 dark:bg-gray-800"
                      style={{
                        width: 'calc(25% - 16px)',
                        maxWidth: '240px',
                        top: '120px',
                        right: '16px',
                      }}
                    >
                      <div className="flex flex-col gap-1.5">
                        <div className="flex gap-1">
                          <input
                            ref={outputSearchRef}
                            type="text"
                            placeholder="搜索..."
                            value={outputSearchQuery}
                            onChange={(e) => {
                              setOutputSearchQuery(e.target.value)
                              // 当搜索内容变化时，重置搜索索引，等待 DOM 更新后再设置
                              setOutputSearchIndex(-1)
                            }}
                            onKeyDown={handleOutputSearch}
                            className="flex-1 rounded border border-gray-300 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                          />
                          <button
                            onClick={() => {
                              setShowOutputSearch(false)
                              setOutputSearchQuery('')
                              setOutputSearchIndex(-1)
                            }}
                            className="rounded border border-gray-300 bg-gray-100 px-2 py-1 text-sm hover:bg-gray-200 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                            title="关闭搜索"
                          >
                            ✕
                          </button>
                        </div>
                        {/* 匹配数量显示和导航按钮 */}
                        {outputSearchQuery && (
                          <div className="flex items-center justify-between gap-1">
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {(() => {
                                // 直接从 DOM 获取 mark 元素数量，这样在压缩模式和格式化模式下都一致
                                const container = outputContentRef.current
                                const allMarks = container ? container.querySelectorAll('mark') : []
                                if (allMarks.length === 0) return '未找到'
                                const currentIndex = outputSearchIndex >= 0 ? outputSearchIndex : 0
                                return `${currentIndex + 1}/${allMarks.length}`
                              })()}
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  const container = outputContentRef.current
                                  const allMarks = container ? container.querySelectorAll('mark') : []
                                  if (allMarks.length > 0) {
                                    setOutputSearchIndex((prev) => {
                                      const currentIndex = prev < 0 ? 0 : prev
                                      return currentIndex > 0 ? currentIndex - 1 : allMarks.length - 1
                                    })
                                  }
                                }}
                                className="rounded bg-blue-500 px-1.5 py-0.5 text-xs text-white transition-colors hover:bg-blue-600 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-700"
                                disabled={!outputSearchQuery}
                                title="上一个 (Enter)"
                              >
                                ↑
                              </button>
                              <button
                                onClick={() => {
                                  const container = outputContentRef.current
                                  const allMarks = container ? container.querySelectorAll('mark') : []
                                  if (allMarks.length > 0) {
                                    setOutputSearchIndex((prev) => {
                                      const currentIndex = prev < 0 ? 0 : prev
                                      return (currentIndex + 1) % allMarks.length
                                    })
                                  }
                                }}
                                className="rounded bg-blue-500 px-1.5 py-0.5 text-xs text-white transition-colors hover:bg-blue-600 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-700"
                                disabled={!outputSearchQuery}
                                title="下一个 (Enter)"
                              >
                                ↓
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {output || parsedJson ? (
                    <div className="flex gap-2 overflow-auto rounded-md border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-900" ref={outputRef}>
                      {/* 行号 */}
                      {output && (
                        <div className="flex flex-col bg-gray-50 py-4 pr-2 pl-4 dark:bg-gray-800">
                          {output.split('\n').map((_, i) => (
                            <div
                              key={i}
                              className="text-right font-mono text-sm text-gray-400 select-none dark:text-gray-500"
                              style={{ lineHeight: '1.5rem' }}
                            >
                              {i + 1}
                            </div>
                          ))}
                        </div>
                      )}
                      {/* 内容区域 */}
                      <div
                        ref={outputContentRef}
                        className="flex-1 overflow-auto"
                        style={{
                          minHeight: '300px',
                        }}
                      >
                        {isCompressed && output ? (
                          // 压缩模式：显示文本
                          outputSearchQuery ? (
                            (() => {
                              const matches: number[] = []
                              const lowerOutput = output.toLowerCase()
                              const lowerQuery = outputSearchQuery.toLowerCase()
                              let index = 0
                              while ((index = lowerOutput.indexOf(lowerQuery, index)) !== -1) {
                                matches.push(index)
                                index += 1
                              }

                              if (matches.length === 0) {
                                return (
                                  <pre className="py-4 pr-4 font-mono text-sm text-gray-900 dark:text-gray-100">
                                    {output}
                                  </pre>
                                )
                              }

                              const parts: React.ReactNode[] = []
                              let lastIndex = 0

                              matches.forEach((matchPos, idx) => {
                                parts.push(output.substring(lastIndex, matchPos))
                                const isCurrentMatch = idx === outputSearchIndex
                                parts.push(
                                  <mark
                                    key={`match-${idx}`}
                                    data-search-index={idx}
                                    className={`${
                                      isCurrentMatch
                                        ? 'bg-orange-400 dark:bg-orange-500 font-bold text-black dark:text-white'
                                        : 'bg-yellow-300 dark:bg-yellow-600 text-gray-900 dark:text-gray-100'
                                    }`}
                                  >
                                    {output.substring(matchPos, matchPos + outputSearchQuery.length)}
                                  </mark>
                                )
                                lastIndex = matchPos + outputSearchQuery.length
                              })

                              parts.push(output.substring(lastIndex))
                              return (
                                <pre className="py-4 pr-4 font-mono text-sm text-gray-900 dark:text-gray-100">
                                  {parts}
                                </pre>
                              )
                            })()
                          ) : (
                            <pre className="py-4 pr-4 font-mono text-sm text-gray-900 dark:text-gray-100">
                              {output}
                            </pre>
                          )
                        ) : parsedJson ? (
                          // 格式化模式：显示树形视图
                          <div className="w-full p-4">
                            {output.length > 50000 && !isCompressed && (
                              <div className="mb-4 rounded-md bg-blue-50 p-3 dark:bg-blue-900/20">
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                  💡 数据量较大（{Math.round(output.length / 1024)}KB），建议使用「压缩」模式查看或搜索，性能更好
                                </p>
                              </div>
                            )}
                            <JsonNode
                              data={parsedJson}
                              indent={indent}
                              onCopySuccess={showCopyToast}
                              searchQuery={outputSearchQuery}
                              searchIndex={outputSearchIndex}
                            />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-auto rounded-md border border-gray-300 bg-white p-4 dark:border-gray-600 dark:bg-gray-900">
                      <p
                        className="text-sm text-gray-500 dark:text-gray-400"
                        style={{
                          minHeight: '300px',
                        }}
                      >
                        格式化后的 JSON 将显示在这里...
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 使用说明 */}
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                <h3 className="mb-2 text-base font-semibold text-gray-900 dark:text-gray-100">
                  使用说明
                </h3>
                <ul className="grid gap-2 text-sm text-gray-600 sm:grid-cols-2 lg:grid-cols-3 dark:text-gray-400">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>输入框带有行号显示，方便定位问题</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>支持 Ctrl+Z 撤销输入（最多10次）</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>格式化显示树形视图，压缩显示文本</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>智能修复换行符导致的格式问题</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>修复操作会显示详细的处理日志</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>鼠标悬停在节点上，显示 📋 复制按钮</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>可以复制单个键值对或整个对象/数组</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>点击修复格式右侧箭头查看更多选项</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast 提示 */}
      {showToast && (
        <div className="fixed right-8 bottom-8 z-50">
          <div className="flex items-center gap-2 rounded-lg bg-green-500 px-4 py-3 text-white shadow-lg transition-all dark:bg-green-600">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="font-medium">复制成功</span>
          </div>
        </div>
      )}
    </div>
  )
}

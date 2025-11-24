'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
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

// JSON 节点组件 - 用于递归显示 JSON 树
interface JsonNodeProps {
  data: unknown
  keyName?: string
  level?: number
  indent?: number
  onCopySuccess?: () => void
}

function JsonNode({ data, keyName, level = 0, indent = 2, onCopySuccess }: JsonNodeProps) {
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
              <span className="font-medium text-red-600 dark:text-red-400">"{keyName}"</span>
            )}
            {keyName && <span className="text-gray-500 dark:text-gray-400">: </span>}
            <span className={valueColor}>
              {typeof data === 'string' ? `"${data}"` : data === null ? 'null' : String(data)}
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
                <span className="font-medium text-red-600 dark:text-red-400">"{keyName}"</span>
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
              <span className="font-bold text-gray-700 dark:text-gray-300">{openBracket}</span>
            </button>
            {collapsed && (
              <>
                <span className="ml-2 text-xs text-gray-400 italic dark:text-gray-500">
                  {itemCount}{' '}
                  {isArray
                    ? itemCount === 1
                      ? 'item'
                      : 'items'
                    : itemCount === 1
                      ? 'key'
                      : 'keys'}
                </span>
                <span className="ml-1 font-bold text-gray-700 dark:text-gray-300">
                  {closeBracket}
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
  const [isCompressed, setIsCompressed] = useState(false) // 是否为压缩模式
  const [inputHistory, setInputHistory] = useState<string[]>([]) // 历史记录
  const [historyIndex, setHistoryIndex] = useState(-1) // 当前历史索引
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // 带历史记录的输入更新
  const updateInput = useCallback(
    (value: string) => {
      setInput(value)
      setError('') // 输入时清除错误

      // 添加历史记录（最多保存10次）
      setInputHistory((prev) => {
        // 如果当前不在历史的最后位置，删除后面的历史
        const newHistory = historyIndex >= 0 ? prev.slice(0, historyIndex + 1) : prev
        // 添加新记录并限制在10条以内
        const updated = [...newHistory, value].slice(-10)
        // 更新索引
        setHistoryIndex(updated.length - 1)
        return updated
      })

      // 自动尝试格式化（静默，不显示错误）
      if (value.trim()) {
        try {
          // 预处理输入
          const processedText = preprocessJSON(value)
          let parsed = JSON.parse(processedText)

          // 如果解析结果是字符串，尝试再次解析（处理转义的 JSON）
          if (typeof parsed === 'string') {
            try {
              parsed = JSON.parse(preprocessJSON(parsed))
            } catch {
              // 第二次解析失败，使用第一次的结果
            }
          }

          const formatted = JSON.stringify(parsed, null, indent)
          setOutput(formatted)
          setParsedJson(parsed)
          setIsCompressed(false)
        } catch {
          // 输入时解析失败不显示错误，保持之前的输出
        }
      } else {
        // 清空输入时也清空输出
        setOutput('')
        setParsedJson(null)
        setIsCompressed(false)
      }
    },
    [historyIndex, indent]
  )

  // 撤销操作（Ctrl+Z）
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      setInput(inputHistory[newIndex])
      setError('') // 撤销时清除错误
    }
  }, [historyIndex, inputHistory])

  // 显示复制成功的浮窗提示
  const showCopyToast = () => {
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2000)
  }

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
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleUndo])

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
      setError('')
      setFixLog([])
      const parsed = parseJSON(input)
      const formatted = JSON.stringify(parsed, null, indent)
      setOutput(formatted)
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
      const compressed = JSON.stringify(parsed)
      setOutput(compressed)
      setParsedJson(null) // 压缩模式不显示树形视图
      setIsCompressed(true)
    } catch (err) {
      setError(`JSON 解析错误: ${err instanceof Error ? err.message : '未知错误'}`)
      setOutput('')
      setParsedJson(null)
      setIsCompressed(false)
    }
  }

  const handleClear = () => {
    updateInput('')
    setOutput('')
    setError('')
    setParsedJson(null)
    setFixLog([])
    setIsCompressed(false)
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
              <div className="grid gap-4 lg:grid-cols-2">
                {/* 输入框 - 带行号 */}
                <div className="flex flex-col">
                  <label
                    htmlFor="input"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    输入 JSON
                  </label>
                  <div className="flex rounded-md border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800">
                    {/* 行号 */}
                    <div className="flex-shrink-0 border-r border-gray-300 bg-gray-50 px-2 py-4 text-right dark:border-gray-600 dark:bg-gray-900">
                      {input.split('\n').map((_, i) => (
                        <div
                          key={i}
                          className="font-mono text-xs leading-6 text-gray-400 dark:text-gray-500"
                        >
                          {i + 1}
                        </div>
                      ))}
                    </div>
                    {/* 文本输入 */}
                    <textarea
                      ref={inputRef}
                      id="input"
                      value={input}
                      onChange={(e) => updateInput(e.target.value)}
                      placeholder="在此粘贴或输入 JSON 数据..."
                      className="min-h-[300px] flex-1 resize-none overflow-auto bg-transparent p-4 font-mono text-sm text-gray-900 focus:outline-none dark:text-gray-100"
                      spellCheck={false}
                      style={{ lineHeight: '1.5rem' }}
                    />
                  </div>
                </div>

                {/* 输出框 - 带行号和内容 */}
                <div className="flex flex-col">
                  <label
                    htmlFor="output"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    {isCompressed ? '压缩结果' : '格式化结果（点击 ▶ ▼ 折叠/展开）'}
                  </label>
                  {output || parsedJson ? (
                    <div className="flex gap-2 overflow-auto rounded-md border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-900">
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
                        className="flex-1 overflow-auto"
                        style={{
                          minHeight: '300px',
                        }}
                      >
                        {isCompressed && output ? (
                          // 压缩模式：显示文本
                          <pre className="py-4 pr-4 font-mono text-sm text-gray-900 dark:text-gray-100">
                            {output}
                          </pre>
                        ) : parsedJson ? (
                          // 格式化模式：显示树形视图
                          <div className="w-full p-4">
                            <JsonNode
                              data={parsedJson}
                              indent={indent}
                              onCopySuccess={showCopyToast}
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

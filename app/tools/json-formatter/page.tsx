'use client'

import { useState, useRef, useEffect } from 'react'
import { genPageMetadata } from 'app/seo'

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
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // 显示复制成功的浮窗提示
  const showCopyToast = () => {
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2000)
  }

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
      const parsed = parseJSON(input)
      const formatted = JSON.stringify(parsed, null, indent)
      setOutput(formatted)
      setParsedJson(parsed)
    } catch (err) {
      setError(`JSON 解析错误: ${err instanceof Error ? err.message : '未知错误'}`)
      setOutput('')
      setParsedJson(null)
    }
  }

  const handleCompress = () => {
    try {
      setError('')
      const parsed = parseJSON(input)
      const compressed = JSON.stringify(parsed)
      setOutput(compressed)
      setParsedJson(parsed)
    } catch (err) {
      setError(`JSON 解析错误: ${err instanceof Error ? err.message : '未知错误'}`)
      setOutput('')
      setParsedJson(null)
    }
  }

  const handleClear = () => {
    setInput('')
    setOutput('')
    setError('')
    setParsedJson(null)
  }

  const handleFix = () => {
    try {
      setError('')
      // 尝试修复并显示修复后的结果
      const fixed = preprocessJSON(input)
      setInput(fixed)
      // 尝试解析验证是否修复成功
      JSON.parse(fixed)
      setError('')
    } catch (err) {
      setError(`修复后仍有错误: ${err instanceof Error ? err.message : '未知错误'}`)
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
    setInput(JSON.stringify(sample))
    setError('')
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
                <button
                  onClick={handleFix}
                  className="rounded-md bg-yellow-500 px-4 py-2 text-white transition-colors hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700"
                >
                  修复格式
                </button>
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
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="在此粘贴或输入 JSON 数据..."
                      className="min-h-[300px] flex-1 resize-none overflow-auto bg-transparent p-4 font-mono text-sm text-gray-900 focus:outline-none dark:text-gray-100"
                      spellCheck={false}
                      style={{ lineHeight: '1.5rem' }}
                    />
                  </div>
                </div>

                {/* 输出框 - 带折叠功能的树形视图 */}
                <div className="flex flex-col">
                  <label
                    htmlFor="output"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    格式化结果（点击 ▶ ▼ 折叠/展开）
                  </label>
                  <div
                    className="overflow-auto rounded-md border border-gray-300 bg-white p-4 dark:border-gray-600 dark:bg-gray-900"
                    style={{
                      minHeight: '300px',
                      maxHeight: 'calc(100vh - 350px)',
                    }}
                  >
                    {parsedJson ? (
                      <div className="w-full">
                        <JsonNode data={parsedJson} indent={indent} onCopySuccess={showCopyToast} />
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        格式化后的 JSON 将显示在这里...
                      </p>
                    )}
                  </div>
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
                    <span>输出结果支持折叠/展开 JSON 节点</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>调整缩进空格数，树形视图会实时响应</span>
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
                    <span>自动识别和修复裸露转义JSON格式</span>
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

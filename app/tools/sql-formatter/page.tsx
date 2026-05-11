'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ToolButton, ToolNotice, ToolPanel, ToolWorkbench } from '@/components/tools/ToolWorkbench'
import {
  formatDatabaseQuery,
  type DatabaseDialect,
  type DatabaseKeywordCase,
} from '../../../lib/tools/sqlFormatters'

type OutputMode = 'formatted' | 'compressed'

const DIALECT_OPTIONS: Array<{ value: DatabaseDialect; label: string; description: string }> = [
  { value: 'mysql', label: 'MySQL', description: 'SQL formatter MySQL dialect' },
  { value: 'doris', label: 'Doris', description: 'MySQL-compatible formatting' },
  { value: 'mongodb', label: 'MongoDB Query', description: 'Prettier / EJSON beautifier' },
]

const SQL_KEYWORDS = [
  'SELECT',
  'FROM',
  'WHERE',
  'INSERT',
  'INTO',
  'VALUES',
  'UPDATE',
  'SET',
  'DELETE',
  'CREATE',
  'TABLE',
  'ALTER',
  'DROP',
  'INDEX',
  'VIEW',
  'DATABASE',
  'SCHEMA',
  'JOIN',
  'INNER',
  'LEFT',
  'RIGHT',
  'OUTER',
  'FULL',
  'CROSS',
  'ON',
  'USING',
  'GROUP',
  'BY',
  'HAVING',
  'ORDER',
  'ASC',
  'DESC',
  'LIMIT',
  'OFFSET',
  'UNION',
  'ALL',
  'DISTINCT',
  'AS',
  'AND',
  'OR',
  'NOT',
  'IN',
  'EXISTS',
  'BETWEEN',
  'LIKE',
  'IS',
  'NULL',
  'TRUE',
  'FALSE',
  'CASE',
  'WHEN',
  'THEN',
  'ELSE',
  'END',
]

const SQL_FUNCTIONS = [
  'COUNT',
  'SUM',
  'AVG',
  'MAX',
  'MIN',
  'CONCAT',
  'SUBSTRING',
  'UPPER',
  'LOWER',
  'TRIM',
  'LENGTH',
  'ROUND',
  'NOW',
  'DATE_FORMAT',
  'IFNULL',
  'COALESCE',
  'CAST',
  'CONVERT',
]

const MONGO_TOKENS = [
  'find',
  'findOne',
  'aggregate',
  'sort',
  'limit',
  'skip',
  'project',
  'insertOne',
  'insertMany',
  'updateOne',
  'updateMany',
  'deleteOne',
  'deleteMany',
  '$match',
  '$group',
  '$project',
  '$sort',
  '$limit',
  '$lookup',
  '$gte',
  '$lte',
  '$gt',
  '$lt',
  '$in',
  '$and',
  '$or',
  '$exists',
]

const controlClass =
  'min-h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100'

const formatterPaneHeightClass = 'h-[clamp(680px,72vh,900px)]'

function countLines(value: string) {
  return value.length === 0 ? 1 : value.split('\n').length
}

function countBytes(value: string) {
  return new Blob([value]).size
}

function formatMeta(value: string) {
  return `${countLines(value)} 行 / ${value.length} 字符 / ${countBytes(value)} bytes`
}

function getDialectLabel(dialect: DatabaseDialect) {
  if (dialect === 'doris') return 'Doris (MySQL compatible)'
  if (dialect === 'mongodb') return 'MongoDB Query'
  return 'MySQL'
}

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

function highlightLine(line: string, dialect: DatabaseDialect, lineIndex: number) {
  const tokenPattern =
    dialect === 'mongodb'
      ? new RegExp(`(${MONGO_TOKENS.map(escapeRegExp).join('|')})`, 'g')
      : new RegExp(
          `(--.*$|#.*$|'(?:[^'\\\\]|\\\\.)*'|"(?:[^"\\\\]|\\\\.)*"|\\b\\d+(?:\\.\\d+)?\\b|\\b(?:${SQL_FUNCTIONS.join(
            '|'
          )})(?=\\s*\\()|\\b(?:${SQL_KEYWORDS.join('|')})\\b)`,
          'gi'
        )

  const parts: ReactNode[] = []
  let lastIndex = 0
  let tokenIndex = 0
  let match: RegExpExecArray | null

  while ((match = tokenPattern.exec(line)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <span key={`${lineIndex}-${tokenIndex++}`}>{line.slice(lastIndex, match.index)}</span>
      )
    }

    const text = match[0]
    parts.push(
      <span key={`${lineIndex}-${tokenIndex++}`} className={getTokenClass(text, dialect)}>
        {text}
      </span>
    )
    lastIndex = match.index + text.length
  }

  if (lastIndex < line.length) {
    parts.push(<span key={`${lineIndex}-${tokenIndex++}`}>{line.slice(lastIndex)}</span>)
  }

  return parts.length > 0 ? parts : line || ' '
}

function getTokenClass(token: string, dialect: DatabaseDialect) {
  if (dialect === 'mongodb') {
    return token.startsWith('$')
      ? 'font-semibold text-emerald-600 dark:text-emerald-400'
      : 'font-semibold text-sky-600 dark:text-sky-400'
  }

  if (token.startsWith('--') || token.startsWith('#')) {
    return 'text-gray-500 italic dark:text-gray-400'
  }
  if (token.startsWith("'") || token.startsWith('"')) {
    return 'text-emerald-600 dark:text-emerald-400'
  }
  if (/^\d/.test(token)) {
    return 'text-amber-600 dark:text-amber-400'
  }
  if (SQL_FUNCTIONS.includes(token.toUpperCase())) {
    return 'font-semibold text-fuchsia-600 dark:text-fuchsia-400'
  }
  return 'font-semibold text-sky-600 dark:text-sky-400'
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function HighlightedCode({ code, dialect }: { code: string; dialect: DatabaseDialect }) {
  return (
    <pre className="min-w-max p-4 font-mono text-sm leading-6 whitespace-pre text-gray-900 dark:text-gray-100">
      {code.split('\n').map((line, index) => (
        <div key={index}>{highlightLine(line, dialect, index)}</div>
      ))}
    </pre>
  )
}

export default function SqlFormatter() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [dialect, setDialect] = useState<DatabaseDialect>('mysql')
  const [keywordCase, setKeywordCase] = useState<DatabaseKeywordCase>('upper')
  const [indent, setIndent] = useState(4)
  const [linesBetweenQueries, setLinesBetweenQueries] = useState(1)
  const [outputMode, setOutputMode] = useState<OutputMode>('formatted')
  const [isFormatting, setIsFormatting] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const requestIdRef = useRef(0)

  const canCopy = output.trim().length > 0
  const selectedDialect = useMemo(
    () => DIALECT_OPTIONS.find((option) => option.value === dialect)!,
    [dialect]
  )

  const runFormat = useCallback(
    async (source = input) => {
      const requestId = requestIdRef.current + 1
      requestIdRef.current = requestId

      if (!source.trim()) {
        setOutput('')
        setError('')
        setOutputMode('formatted')
        return
      }

      setIsFormatting(true)
      try {
        const result = await formatDatabaseQuery(source, {
          dialect,
          keywordCase,
          tabWidth: indent,
          linesBetweenQueries,
        })

        if (requestIdRef.current === requestId) {
          setOutput(result.output)
          setError('')
          setOutputMode('formatted')
        }
      } catch (err) {
        if (requestIdRef.current === requestId) {
          setOutput('')
          setError(
            `${getDialectLabel(dialect)} 格式化失败: ${
              err instanceof Error ? err.message : '未知错误'
            }`
          )
        }
      } finally {
        if (requestIdRef.current === requestId) {
          setIsFormatting(false)
        }
      }
    },
    [dialect, indent, input, keywordCase, linesBetweenQueries]
  )

  useEffect(() => {
    if (!input.trim()) {
      setOutput('')
      setError('')
      setOutputMode('formatted')
      return
    }

    const timer = window.setTimeout(() => {
      void runFormat(input)
    }, 220)

    return () => window.clearTimeout(timer)
  }, [input, runFormat])

  const handleCompress = () => {
    if (!input.trim()) {
      setOutput('')
      setError('')
      return
    }

    const compressed = input
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/\s*;\s*/g, '; ')
      .replace(/\s*,\s*/g, ', ')
      .replace(/\s*\(\s*/g, '(')
      .replace(/\s*\)\s*/g, ')')
      .trim()

    setOutput(compressed)
    setOutputMode('compressed')
    setError('')
  }

  const handleClear = () => {
    setInput('')
    setOutput('')
    setError('')
    setOutputMode('formatted')
    inputRef.current?.focus()
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output)
      setShowToast(true)
      window.setTimeout(() => setShowToast(false), 2000)
    } catch {
      setError('复制失败，请手动选择结果复制')
    }
  }

  const handleSample = () => {
    const samples: Record<DatabaseDialect, string> = {
      mysql: `-- 查询活跃用户及其订单信息
SELECT u.id, u.name, u.email, o.order_id, o.total_amount FROM users u LEFT JOIN orders o ON u.id = o.user_id WHERE u.status = 'active' AND o.created_at >= '2024-01-01' GROUP BY u.id, u.name ORDER BY o.total_amount DESC LIMIT 10;`,
      doris: `-- Doris 查询示例
SELECT u.id, u.name, COUNT(o.order_id) AS order_count, SUM(o.amount) AS total_amount FROM users u LEFT JOIN orders o ON u.id = o.user_id WHERE u.created_at >= '2024-01-01' GROUP BY u.id, u.name ORDER BY total_amount DESC LIMIT 100;`,
      mongodb: `db.users.find({status:"active",age:{$gte:18,$lte:65},tags:{$in:["developer","engineer"]}}).sort({created_at:-1,name:1}).limit(10)`,
    }

    setInput(samples[dialect])
    setOutputMode('formatted')
    inputRef.current?.focus()
  }

  const statusLabel = error
    ? '格式化失败'
    : isFormatting
    ? '格式化中'
    : output
    ? outputMode === 'compressed'
      ? '已压缩'
      : '已格式化'
    : input.trim()
    ? '待格式化'
    : '空输入'

  const statusTone = error ? 'danger' : output ? 'success' : input.trim() ? 'info' : 'neutral'

  return (
    <ToolWorkbench
      title="SQL 格式化工具"
      description="使用开源格式化器处理 MySQL、Doris 兼容 SQL 和 MongoDB 查询，让查询语句更容易检查、复制和分享。"
      statusLabel={statusLabel}
      statusTone={statusTone}
      toolbar={
        <>
          <ToolButton variant="primary" onClick={() => void runFormat()}>
            格式化
          </ToolButton>
          <ToolButton variant="secondary" onClick={handleCompress}>
            压缩
          </ToolButton>
          <ToolButton variant="muted" onClick={handleClear}>
            清空
          </ToolButton>
          <ToolButton variant="muted" onClick={handleSample}>
            示例数据
          </ToolButton>
          <ToolButton variant="success" onClick={handleCopy} disabled={!canCopy}>
            复制结果
          </ToolButton>

          <div className="ml-0 flex flex-wrap items-center gap-2 lg:ml-auto">
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">
              数据库
              <select
                value={dialect}
                onChange={(event) => setDialect(event.target.value as DatabaseDialect)}
                className={`ml-2 ${controlClass}`}
              >
                {DIALECT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            {dialect !== 'mongodb' && (
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                关键字
                <select
                  value={keywordCase}
                  onChange={(event) => setKeywordCase(event.target.value as DatabaseKeywordCase)}
                  className={`ml-2 ${controlClass}`}
                >
                  <option value="upper">大写</option>
                  <option value="lower">小写</option>
                  <option value="preserve">保留</option>
                </select>
              </label>
            )}

            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">
              缩进
              <select
                value={indent}
                onChange={(event) => setIndent(Number(event.target.value))}
                className={`ml-2 ${controlClass}`}
              >
                <option value={2}>2</option>
                <option value={4}>4</option>
                <option value={8}>8</option>
              </select>
            </label>

            {dialect !== 'mongodb' && (
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                语句间隔
                <select
                  value={linesBetweenQueries}
                  onChange={(event) => setLinesBetweenQueries(Number(event.target.value))}
                  className={`ml-2 ${controlClass}`}
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                </select>
              </label>
            )}
          </div>
        </>
      }
      feedback={
        <>
          {error && (
            <ToolNotice tone="danger" title="格式化错误">
              {error}
            </ToolNotice>
          )}
          {dialect === 'doris' && (
            <ToolNotice tone="info" title="Doris 兼容说明">
              当前使用 `sql-formatter` 的 MySQL 方言处理 Doris 查询。Doris
              专有语法如果无法解析，会显示明确错误。
            </ToolNotice>
          )}
          {dialect === 'mongodb' && (
            <ToolNotice tone="info" title="MongoDB Query">
              MongoDB 链式查询使用 Prettier 美化；纯对象或 Extended JSON 输入优先使用 EJSON/JSON
              输出。
            </ToolNotice>
          )}
        </>
      }
    >
      <ToolPanel title={`输入 ${selectedDialect.label}`} meta={formatMeta(input)}>
        <div
          className={`flex ${formatterPaneHeightClass} overflow-hidden bg-white dark:bg-gray-950`}
        >
          <LineNumbers text={input} />
          <textarea
            ref={inputRef}
            id="input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={`在此粘贴或输入 ${selectedDialect.label} 查询...`}
            className="h-full flex-1 resize-none overflow-auto bg-transparent p-4 font-mono text-sm leading-6 text-gray-900 focus:outline-none dark:text-gray-100"
            spellCheck={false}
          />
        </div>
      </ToolPanel>

      <ToolPanel
        title={outputMode === 'compressed' ? '压缩结果' : '格式化结果'}
        meta={
          output ? `${formatMeta(output)} / ${getDialectLabel(dialect)}` : getDialectLabel(dialect)
        }
        actions={
          <ToolButton variant="secondary" onClick={handleCopy} disabled={!canCopy}>
            复制
          </ToolButton>
        }
      >
        <div className={`flex ${formatterPaneHeightClass} overflow-auto bg-white dark:bg-gray-950`}>
          {output ? (
            <>
              <LineNumbers text={output} />
              <div className="min-w-0 flex-1 overflow-auto">
                <HighlightedCode code={output} dialect={dialect} />
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-8 text-sm text-gray-500 dark:text-gray-400">
              格式化后的结果将显示在这里
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

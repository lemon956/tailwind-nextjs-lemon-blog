'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { genPageMetadata } from 'app/seo'

// SQL 方言类型
type SQLDialect = 'mysql' | 'mongodb' | 'doris'

// SQL 关键字定义
const SQL_KEYWORDS = {
  mysql: [
    'SELECT', 'FROM', 'WHERE', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE',
    'CREATE', 'TABLE', 'ALTER', 'DROP', 'INDEX', 'VIEW', 'DATABASE', 'SCHEMA',
    'JOIN', 'INNER', 'LEFT', 'RIGHT', 'OUTER', 'FULL', 'CROSS', 'ON', 'USING',
    'GROUP', 'BY', 'HAVING', 'ORDER', 'ASC', 'DESC', 'LIMIT', 'OFFSET',
    'UNION', 'ALL', 'DISTINCT', 'AS', 'AND', 'OR', 'NOT', 'IN', 'EXISTS',
    'BETWEEN', 'LIKE', 'IS', 'NULL', 'TRUE', 'FALSE',
    'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'CONSTRAINT', 'UNIQUE',
    'AUTOINCREMENT', 'AUTO_INCREMENT', 'DEFAULT', 'CHECK',
    'IF', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
    'BEGIN', 'COMMIT', 'ROLLBACK', 'TRANSACTION',
    'INT', 'VARCHAR', 'TEXT', 'DATE', 'DATETIME', 'TIMESTAMP',
    'BIGINT', 'SMALLINT', 'DECIMAL', 'FLOAT', 'DOUBLE', 'BOOLEAN',
  ],
  mongodb: [
    'find', 'findOne', 'insertOne', 'insertMany', 'updateOne', 'updateMany',
    'deleteOne', 'deleteMany', 'aggregate', 'count', 'distinct',
    '$match', '$group', '$project', '$sort', '$limit', '$skip',
    '$lookup', '$unwind', '$addFields', '$set', '$unset',
    '$eq', '$ne', '$gt', '$gte', '$lt', '$lte', '$in', '$nin',
    '$and', '$or', '$not', '$nor', '$exists', '$type',
    '$sum', '$avg', '$min', '$max', '$push', '$first', '$last',
  ],
}

// SQL 格式化配置
interface FormatOptions {
  indent: number
  uppercase: boolean
  linesBetweenQueries: number
}

export default function SqlFormatter() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [dialect, setDialect] = useState<SQLDialect>('mysql')
  const [uppercase, setUppercase] = useState(true)
  const [showToast, setShowToast] = useState(false)
  const [inputHistory, setInputHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  
  // 固定缩进为4个字符
  const indent = 4
  const linesBetweenQueries = 1

  // 语法高亮函数
  const highlightSQL = (code: string, currentDialect: SQLDialect): React.ReactElement[] => {
    const lines = code.split('\n')
    
    const highlightLine = (line: string, lineIndex: number): React.ReactElement => {
      // 保留空行（包括只有空格的行）
      if (!line.trim()) {
        return <div key={lineIndex}>{line || ' '}</div>
      }

      const tokens: React.ReactElement[] = []
      let currentIndex = 0

      if (currentDialect === 'mysql' || currentDialect === 'doris') {
        // SQL 关键字
        const keywords = SQL_KEYWORDS.mysql
        const keywordPattern = new RegExp(
          `\\b(${keywords.join('|')})\\b`,
          'gi'
        )
        
        // 函数（常见的 SQL 函数）
        const functions = [
          'COUNT', 'SUM', 'AVG', 'MAX', 'MIN', 'CONCAT', 'SUBSTRING', 'UPPER', 'LOWER',
          'TRIM', 'LENGTH', 'ROUND', 'FLOOR', 'CEIL', 'NOW', 'CURDATE', 'DATE_FORMAT',
          'IFNULL', 'COALESCE', 'CAST', 'CONVERT', 'YEAR', 'MONTH', 'DAY'
        ]
        const functionPattern = new RegExp(`\\b(${functions.join('|')})\\s*\\(`, 'gi')

        let match
        let lastIndex = 0
        const matches: Array<{ start: number; end: number; type: string; text: string }> = []

        // 收集所有匹配
        const allText = line
        
        // 匹配字符串
        const stringRegex = /'([^'\\]|\\.)*'/g
        while ((match = stringRegex.exec(allText)) !== null) {
          matches.push({ start: match.index, end: match.index + match[0].length, type: 'string', text: match[0] })
        }

        // 匹配数字
        const numberRegex = /\b\d+(\.\d+)?\b/g
        while ((match = numberRegex.exec(allText)) !== null) {
          matches.push({ start: match.index, end: match.index + match[0].length, type: 'number', text: match[0] })
        }

        // 匹配函数
        while ((match = functionPattern.exec(allText)) !== null) {
          const funcName = match[1]
          matches.push({ start: match.index, end: match.index + funcName.length, type: 'function', text: funcName })
        }

        // 匹配关键字
        while ((match = keywordPattern.exec(allText)) !== null) {
          matches.push({ start: match.index, end: match.index + match[0].length, type: 'keyword', text: match[0] })
        }

        // 按位置排序并去重
        matches.sort((a, b) => a.start - b.start)
        const uniqueMatches: typeof matches = []
        for (const m of matches) {
          if (uniqueMatches.length === 0 || m.start >= uniqueMatches[uniqueMatches.length - 1].end) {
            uniqueMatches.push(m)
          }
        }

        // 生成高亮的元素
        let tokenIndex = 0
        for (const m of uniqueMatches) {
          // 添加前面的普通文本
          if (m.start > lastIndex) {
            tokens.push(<span key={`${lineIndex}-${tokenIndex++}`}>{line.substring(lastIndex, m.start)}</span>)
          }

          // 添加高亮的文本
          const className =
            m.type === 'keyword'
              ? 'text-blue-600 dark:text-blue-400 font-semibold'
              : m.type === 'function'
              ? 'text-purple-600 dark:text-purple-400 font-semibold'
              : m.type === 'string'
              ? 'text-green-600 dark:text-green-400'
              : m.type === 'number'
              ? 'text-orange-600 dark:text-orange-400'
              : ''

          tokens.push(
            <span key={`${lineIndex}-${tokenIndex++}`} className={className}>
              {m.text}
            </span>
          )

          lastIndex = m.end
        }

        // 添加剩余的文本
        if (lastIndex < line.length) {
          tokens.push(<span key={`${lineIndex}-${tokenIndex++}`}>{line.substring(lastIndex)}</span>)
        }
      } else if (currentDialect === 'mongodb') {
        // MongoDB 高亮
        const mongoKeywords = SQL_KEYWORDS.mongodb
        const mongoPattern = new RegExp(`\\b(${mongoKeywords.join('|')})\\b`, 'g')
        
        let match
        let lastIndex = 0
        let tokenIndex = 0

        // 匹配字符串
        const stringRegex = /"([^"\\]|\\.)*"/g
        const stringMatches: Array<{ start: number; end: number }> = []
        while ((match = stringRegex.exec(line)) !== null) {
          stringMatches.push({ start: match.index, end: match.index + match[0].length })
        }

        // 匹配关键字/操作符（不在字符串内）
        while ((match = mongoPattern.exec(line)) !== null) {
          const isInString = stringMatches.some(s => match.index >= s.start && match.index < s.end)
          if (!isInString) {
            if (match.index > lastIndex) {
              tokens.push(<span key={`${lineIndex}-${tokenIndex++}`}>{line.substring(lastIndex, match.index)}</span>)
            }
            tokens.push(
              <span key={`${lineIndex}-${tokenIndex++}`} className="text-purple-600 dark:text-purple-400 font-semibold">
                {match[0]}
              </span>
            )
            lastIndex = match.index + match[0].length
          }
        }

        // 高亮字符串
        lastIndex = 0
        tokenIndex = 0
        const result: React.ReactElement[] = []
        
        for (const strMatch of stringMatches) {
          if (strMatch.start > lastIndex) {
            const between = line.substring(lastIndex, strMatch.start)
            // 在非字符串部分应用关键字高亮
            const highlighted = highlightMongoKeywords(between, tokenIndex)
            result.push(...highlighted.tokens)
            tokenIndex = highlighted.nextIndex
          }
          result.push(
            <span key={`${lineIndex}-${tokenIndex++}`} className="text-green-600 dark:text-green-400">
              {line.substring(strMatch.start, strMatch.end)}
            </span>
          )
          lastIndex = strMatch.end
        }

        if (lastIndex < line.length) {
          const rest = line.substring(lastIndex)
          const highlighted = highlightMongoKeywords(rest, tokenIndex)
          result.push(...highlighted.tokens)
        }

        return <div key={lineIndex}>{result.length > 0 ? result : line}</div>
      }

      return <div key={lineIndex}>{tokens.length > 0 ? tokens : line}</div>
    }

    const highlightMongoKeywords = (text: string, startIndex: number): { tokens: React.ReactElement[]; nextIndex: number } => {
      const tokens: React.ReactElement[] = []
      const mongoKeywords = SQL_KEYWORDS.mongodb
      const pattern = new RegExp(`\\b(${mongoKeywords.join('|')})\\b`, 'g')
      
      let match
      let lastIndex = 0
      let tokenIndex = startIndex

      while ((match = pattern.exec(text)) !== null) {
        if (match.index > lastIndex) {
          tokens.push(<span key={`tok-${tokenIndex++}`}>{text.substring(lastIndex, match.index)}</span>)
        }
        tokens.push(
          <span key={`tok-${tokenIndex++}`} className="text-purple-600 dark:text-purple-400 font-semibold">
            {match[0]}
          </span>
        )
        lastIndex = match.index + match[0].length
      }

      if (lastIndex < text.length) {
        tokens.push(<span key={`tok-${tokenIndex++}`}>{text.substring(lastIndex)}</span>)
      }

      return { tokens, nextIndex: tokenIndex }
    }

    return lines.map((line, i) => highlightLine(line, i))
  }

  // 显示复制成功的浮窗提示
  const showCopyToast = () => {
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2000)
  }

  // 带历史记录的输入更新
  const updateInput = useCallback(
    (value: string) => {
      setInput(value)
      setError('')

      // 添加历史记录（最多保存10次）
      setInputHistory((prev) => {
        const newHistory = historyIndex >= 0 ? prev.slice(0, historyIndex + 1) : prev
        const updated = [...newHistory, value].slice(-10)
        setHistoryIndex(updated.length - 1)
        return updated
      })

      // 自动格式化
      if (value.trim()) {
        try {
          const formatted = formatSQL(value, { indent, uppercase, linesBetweenQueries })
          setOutput(formatted)
        } catch {
          // 输入时格式化失败不显示错误
        }
      } else {
        setOutput('')
      }
    },
    [historyIndex, indent, uppercase, linesBetweenQueries]
  )

  // 撤销操作（Ctrl+Z）
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      setInput(inputHistory[newIndex])
      setError('')
    }
  }, [historyIndex, inputHistory])

  // 监听键盘事件 (Ctrl+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        const target = e.target as HTMLElement
        if (target.id === 'input') {
          e.preventDefault()
          handleUndo()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleUndo])

  // 监听格式化选项变化，自动重新格式化
  useEffect(() => {
    if (input.trim() && output) {
      try {
        const formatted = formatSQL(input, { indent, uppercase, linesBetweenQueries })
        setOutput(formatted)
        setError('') // 清除之前的错误
      } catch (err) {
        // 格式化失败时保持原输出，不显示错误
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uppercase, dialect])

  // SQL 格式化核心函数
  const formatSQL = (sql: string, options: FormatOptions): string => {
    if (!sql.trim()) return ''

    let formatted = sql.trim()

    // MongoDB 特殊处理
    if (dialect === 'mongodb') {
      return formatMongoDB(formatted, options)
    }

    // SQL 格式化 (MySQL, Doris)
    const indentStr = ' '.repeat(options.indent)
    const keywords = SQL_KEYWORDS.mysql

    // 分割多个SQL语句（以分号分隔）
    const statements = formatted.split(';').filter((s) => s.trim())

    const formattedStatements = statements.map((statement) => {
      let result = statement.trim()

      // 移除多余的空白
      result = result.replace(/\s+/g, ' ')

      // 关键字大小写处理
      const keywordCase = (keyword: string) => 
        options.uppercase ? keyword.toUpperCase() : keyword.toLowerCase()

      // 先处理所有关键字的大小写
      keywords.forEach((keyword) => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi')
        result = result.replace(regex, (match) => keywordCase(keyword))
      })

      // 检测语句类型
      const upperResult = result.toUpperCase()
      const isSelect = upperResult.startsWith('SELECT')
      const isInsert = upperResult.startsWith('INSERT')
      const isUpdate = upperResult.startsWith('UPDATE')
      const isDelete = upperResult.startsWith('DELETE')
      const isCreate = upperResult.startsWith('CREATE')
      const isAlter = upperResult.startsWith('ALTER')
      const isDrop = upperResult.startsWith('DROP')

      if (isSelect) {
        // SELECT 语句格式化
        result = formatSelectStatement(result, indentStr, keywordCase)
      } else if (isInsert) {
        // INSERT 语句格式化
        result = formatInsertStatement(result, indentStr, keywordCase)
      } else if (isUpdate) {
        // UPDATE 语句格式化
        result = formatUpdateStatement(result, indentStr, keywordCase)
      } else if (isDelete) {
        // DELETE 语句格式化
        result = formatDeleteStatement(result, indentStr, keywordCase)
      } else if (isCreate || isAlter || isDrop) {
        // DDL 语句格式化
        result = formatDDLStatement(result, indentStr, keywordCase)
      }

      return result
    })

    // 用分号和换行连接多个语句
    const separator = ';\n' + '\n'.repeat(options.linesBetweenQueries)
    return formattedStatements.join(separator) + ';'
  }

  // 格式化 SELECT 语句
  const formatSelectStatement = (
    sql: string,
    indentStr: string,
    keywordCase: (kw: string) => string
  ): string => {
    let result = sql

    // 提取各个子句
    const selectMatch = result.match(/^(SELECT\s+(?:DISTINCT\s+)?)([\s\S]*?)(\s+FROM\s+)/i)
    if (selectMatch) {
      const selectKeyword = selectMatch[1].trim()
      const columns = selectMatch[2]
      const fromKeyword = selectMatch[3].trim()

      // 格式化 SELECT 列
      const formattedColumns = columns
        .split(',')
        .map((col) => indentStr + col.trim())
        .join(',\n')

      result = result.replace(selectMatch[0], `${selectKeyword}\n${formattedColumns}\n${fromKeyword} `)
    }

    // 处理 FROM 子句（表和JOIN）
    result = result.replace(
      /(\s+)(INNER\s+JOIN|LEFT\s+JOIN|RIGHT\s+JOIN|FULL\s+JOIN|CROSS\s+JOIN|JOIN)(\s+)/gi,
      (match, before, join, after) => `\n${keywordCase(join.trim())}${after}`
    )

    // 处理 WHERE 子句
    result = result.replace(/(\s+)(WHERE)(\s+)/gi, (match, before, where, after) => {
      return `\n${keywordCase(where)}${after}`
    })

    // 处理 WHERE 中的 AND/OR
    result = result.replace(/(WHERE\s+[\s\S]*?)(\s+)(AND|OR)(\s+)/gi, (match, before, ws1, andor, ws2) => {
      return `${before}\n${indentStr}${keywordCase(andor)}${ws2}`
    })

    // 处理 GROUP BY
    result = result.replace(/(\s+)(GROUP\s+BY)(\s+)/gi, (match, before, groupby, after) => {
      return `\n${keywordCase(groupby)}${after}`
    })

    // 处理 HAVING
    result = result.replace(/(\s+)(HAVING)(\s+)/gi, (match, before, having, after) => {
      return `\n${keywordCase(having)}${after}`
    })

    // 处理 ORDER BY
    result = result.replace(/(\s+)(ORDER\s+BY)(\s+)/gi, (match, before, orderby, after) => {
      return `\n${keywordCase(orderby)}${after}`
    })

    // 处理 LIMIT
    result = result.replace(/(\s+)(LIMIT)(\s+)/gi, (match, before, limit, after) => {
      return `\n${keywordCase(limit)}${after}`
    })

    // 处理 OFFSET
    result = result.replace(/(\s+)(OFFSET)(\s+)/gi, (match, before, offset, after) => {
      return ` ${keywordCase(offset)}${after}`
    })

    return result
  }

  // 格式化 INSERT 语句
  const formatInsertStatement = (
    sql: string,
    indentStr: string,
    keywordCase: (kw: string) => string
  ): string => {
    let result = sql

    // 处理 INSERT INTO
    result = result.replace(
      /^(INSERT\s+INTO\s+)(\S+)(\s*\(([\s\S]*?)\))?(\s+VALUES)/i,
      (match, insertInto, table, columnsPart, columns, values) => {
        let formatted = `${keywordCase('INSERT INTO')} ${table}`
        if (columnsPart) {
          const formattedColumns = columns
            .split(',')
            .map((col: string) => col.trim())
            .join(', ')
          formatted += ` (${formattedColumns})`
        }
        formatted += `\n${keywordCase('VALUES')}`
        return formatted
      }
    )

    // 处理 VALUES 后的多行数据
    result = result.replace(/VALUES\s*(\([\s\S]*?\))(?:\s*,\s*(\([\s\S]*?\)))*/gi, (match) => {
      const values = match.match(/\([^)]+\)/g) || []
      const formattedValues = values.map((v) => indentStr + v).join(',\n')
      return `${keywordCase('VALUES')}\n${formattedValues}`
    })

    return result
  }

  // 格式化 UPDATE 语句
  const formatUpdateStatement = (
    sql: string,
    indentStr: string,
    keywordCase: (kw: string) => string
  ): string => {
    let result = sql

    // 处理 SET 子句
    result = result.replace(/(\s+)(SET)(\s+)/gi, (match, before, set, after) => {
      return `\n${keywordCase(set)}\n`
    })

    // 处理 SET 后的赋值列表
    result = result.replace(
      /SET\s+([\s\S]*?)(\s+WHERE|$)/i,
      (match, sets, rest) => {
        const setList = sets
          .split(',')
          .map((s: string) => indentStr + s.trim())
          .join(',\n')
        return `${keywordCase('SET')}\n${setList}${rest}`
      }
    )

    // 处理 WHERE
    result = result.replace(/(\s+)(WHERE)(\s+)/gi, (match, before, where, after) => {
      return `\n${keywordCase(where)}${after}`
    })

    return result
  }

  // 格式化 DELETE 语句
  const formatDeleteStatement = (
    sql: string,
    indentStr: string,
    keywordCase: (kw: string) => string
  ): string => {
    let result = sql

    // 处理 FROM
    result = result.replace(/(\s+)(FROM)(\s+)/gi, (match, before, from, after) => {
      return ` ${keywordCase(from)}${after}`
    })

    // 处理 WHERE
    result = result.replace(/(\s+)(WHERE)(\s+)/gi, (match, before, where, after) => {
      return `\n${keywordCase(where)}${after}`
    })

    // 处理 WHERE 中的 AND/OR
    result = result.replace(/(WHERE\s+[\s\S]*?)(\s+)(AND|OR)(\s+)/gi, (match, before, ws1, andor, ws2) => {
      return `${before}\n${indentStr}${keywordCase(andor)}${ws2}`
    })

    return result
  }

  // 格式化 DDL 语句
  const formatDDLStatement = (
    sql: string,
    indentStr: string,
    keywordCase: (kw: string) => string
  ): string => {
    let result = sql

    // 处理 CREATE TABLE
    if (result.toUpperCase().includes('CREATE TABLE')) {
      result = result.replace(
        /(CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?)([\w`]+)(\s*\()([\s\S]*?)(\))/i,
        (match, create, table, openParen, columns, closeParen) => {
          const formattedColumns = columns
            .split(',')
            .map((col: string) => indentStr + col.trim())
            .join(',\n')
          return `${keywordCase('CREATE TABLE')} ${table}${openParen}\n${formattedColumns}\n${closeParen}`
        }
      )
    }

    return result
  }

  // MongoDB 查询格式化
  const formatMongoDB = (query: string, options: FormatOptions): string => {
    try {
      // 如果是纯 JSON 格式，直接格式化
      const trimmed = query.trim()
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        const parsed = JSON.parse(trimmed)
        return JSON.stringify(parsed, null, options.indent)
      }

      // 辅助函数：将 JavaScript 对象字面量转换为有效的 JSON
      const jsObjectToJSON = (jsStr: string): string => {
        // 给没有引号的属性名添加引号
        let result = jsStr
        
        // 处理对象属性名：word: -> "word":
        // 匹配 { 或 , 后面跟着空格，然后是标识符（不含引号），然后是冒号
        result = result.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)(\s*):/g, (match, prefix, key, space) => {
          // 确保前面的字符不是引号
          return `${prefix}"${key}"${space}:`
        })
        
        return result
      }

      // 辅助函数：格式化 JSON 字符串
      const formatJSON = (jsonStr: string): string => {
        try {
          // 移除所有换行和多余空白，确保是紧凑格式
          const compactStr = jsonStr.replace(/\s+/g, ' ').trim()
          
          // 先转换为有效的 JSON
          const validJSON = jsObjectToJSON(compactStr)
          const parsed = JSON.parse(validJSON)
          
          // 使用4个空格缩进格式化 JSON
          const formatted = JSON.stringify(parsed, null, 4)
          return formatted
        } catch (e) {
          console.error('JSON parse error:', e, 'for string:', jsonStr)
          return jsonStr
        }
      }

      // 辅助函数：跳过字符串字面量
      const skipString = (str: string, start: number): number => {
        let i = start + 1 // 跳过开始的引号
        while (i < str.length) {
          if (str[i] === '\\') {
            i += 2 // 跳过转义字符
            continue
          }
          if (str[i] === '"') {
            return i + 1 // 返回引号后的位置
          }
          i++
        }
        return i
      }

      // 辅助函数：找到匹配的右括号
      const findMatchingParen = (str: string, start: number): number => {
        let depth = 1
        let i = start
        
        while (i < str.length && depth > 0) {
          if (str[i] === '"') {
            i = skipString(str, i)
            continue
          }
          
          if (str[i] === '(' || str[i] === '[' || str[i] === '{') {
            depth++
          } else if (str[i] === ')' || str[i] === ']' || str[i] === '}') {
            depth--
          }
          
          i++
        }
        
        return i - 1 // 返回右括号的位置
      }

      // 手动解析并格式化方法链式调用
      let result = ''
      let i = 0
      
      while (i < query.length) {
        // 查找标识符（方法名、变量名等）
        const identMatch = query.substring(i).match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)/)
        
        if (identMatch) {
          const ident = identMatch[0]
          result += ident
          i += ident.length
          
          // 跳过空格
          while (i < query.length && /\s/.test(query[i])) {
            i++
          }
          
          // 检查是否是方法调用（有括号）
          if (i < query.length && query[i] === '(') {
            result += '('
            i++
            
            // 找到匹配的右括号
            const closeParen = findMatchingParen(query, i)
            
            // 提取参数
            const args = query.substring(i, closeParen).trim()
            
            // 如果参数是 JSON 对象或数组，格式化它
            if (args && (args.startsWith('{') || args.startsWith('['))) {
              result += formatJSON(args)
            } else if (args) {
              result += args
            }
            
            result += ')'
            i = closeParen + 1
            
            // 跳过空格
            while (i < query.length && /\s/.test(query[i])) {
              i++
            }
            
            // 检查是否有链式调用
            if (i < query.length && query[i] === '.') {
              // 检查下一个是否是方法调用（.method(）而不仅仅是属性访问（.property）
              const lookAhead = query.substring(i + 1).match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/)
              if (lookAhead) {
                // 这是链式方法调用，添加换行
                result += '\n.'
                i++
                continue
              }
            }
          } else if (i < query.length && query[i] === '.') {
            // 属性访问，不换行
            result += '.'
            i++
          }
        } else {
          result += query[i]
          i++
        }
      }

      return result
    } catch (err) {
      console.error('MongoDB format error:', err)
      return query
    }
  }

  const handleFormat = () => {
    try {
      setError('')
      const formatted = formatSQL(input, { indent, uppercase, linesBetweenQueries })
      setOutput(formatted)
    } catch (err) {
      setError(`格式化错误: ${err instanceof Error ? err.message : '未知错误'}`)
      setOutput('')
    }
  }

  const handleCompress = () => {
    try {
      setError('')
      let compressed = input.trim()

      if (dialect === 'mongodb') {
        // MongoDB 压缩
        if (compressed.startsWith('{') || compressed.startsWith('[')) {
          const parsed = JSON.parse(compressed)
          compressed = JSON.stringify(parsed)
        } else {
          compressed = compressed.replace(/\s+/g, ' ').replace(/\n/g, '')
        }
      } else {
        // SQL 压缩
        compressed = compressed
          .replace(/\s+/g, ' ')
          .replace(/\s*;\s*/g, '; ')
          .replace(/\s*,\s*/g, ', ')
          .replace(/\s*\(\s*/g, '(')
          .replace(/\s*\)\s*/g, ')')
      }

      setOutput(compressed)
    } catch (err) {
      setError(`压缩错误: ${err instanceof Error ? err.message : '未知错误'}`)
      setOutput('')
    }
  }

  const handleClear = () => {
    updateInput('')
    setOutput('')
    setError('')
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
    const samples: Record<SQLDialect, string> = {
      mysql: `SELECT u.id, u.name, u.email, o.order_id, o.total_amount FROM users u LEFT JOIN orders o ON u.id = o.user_id WHERE u.status = 'active' AND o.created_at >= '2024-01-01' GROUP BY u.id, u.name ORDER BY o.total_amount DESC LIMIT 10;`,
      mongodb: `db.users.find({ status: "active", age: { $gte: 18, $lte: 65 }, tags: { $in: ["developer", "engineer"] } }).sort({ created_at: -1, name: 1 }).limit(10)`,
      doris: `SELECT u.id, u.name, COUNT(o.order_id) as order_count, SUM(o.amount) as total_amount FROM users u LEFT JOIN orders o ON u.id = o.user_id WHERE u.created_at >= '2024-01-01' GROUP BY u.id, u.name ORDER BY total_amount DESC LIMIT 100;`,
    }
    updateInput(samples[dialect])
  }

  return (
    <div className="relative right-1/2 left-1/2 -mr-[50vw] -ml-[50vw] w-screen">
      <div className="mx-auto max-w-[95vw] px-4 sm:px-6 lg:px-8">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          <div className="space-y-2 pt-6 pb-6 md:space-y-3">
            <h1 className="text-3xl leading-9 font-extrabold tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:text-5xl md:leading-14 dark:text-gray-100">
              SQL 格式化工具
            </h1>
            <p className="text-base leading-7 text-gray-500 dark:text-gray-400">
              支持 MySQL、MongoDB、Doris 等多种数据库语法格式化
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

                {/* 数据库方言选择 */}
                <div className="flex items-center gap-2">
                  <label htmlFor="dialect" className="text-sm text-gray-700 dark:text-gray-300">
                    数据库:
                  </label>
                  <select
                    id="dialect"
                    value={dialect}
                    onChange={(e) => setDialect(e.target.value as SQLDialect)}
                    className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                  >
                    <option value="mysql">MySQL</option>
                    <option value="doris">Doris</option>
                    <option value="mongodb">MongoDB</option>
                  </select>
                </div>

                {/* 关键字大小写 */}
                {dialect !== 'mongodb' && (
                  <div className="flex items-center gap-2">
                    <label htmlFor="uppercase" className="text-sm text-gray-700 dark:text-gray-300">
                      关键字大写:
                    </label>
                    <input
                      type="checkbox"
                      id="uppercase"
                      checked={uppercase}
                      onChange={(e) => setUppercase(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </div>
                )}
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
                    输入 SQL
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
                      placeholder={`在此粘贴或输入 ${dialect.toUpperCase()} 语句...`}
                      className="min-h-[400px] flex-1 resize-none overflow-auto bg-transparent p-4 font-mono text-sm text-gray-900 focus:outline-none dark:text-gray-100"
                      spellCheck={false}
                      style={{ lineHeight: '1.5rem' }}
                    />
                  </div>
                </div>

                {/* 输出框 - 带行号和语法高亮 */}
                <div className="flex flex-col">
                  <label
                    htmlFor="output"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    格式化结果（语法高亮）
                  </label>
                  <div className="flex rounded-md border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800">
                    {output ? (
                      <>
                        {/* 行号 */}
                        <div className="flex-shrink-0 border-r border-gray-300 bg-gray-50 px-2 py-4 text-right dark:border-gray-600 dark:bg-gray-900">
                          {output.split('\n').map((_, i) => (
                            <div
                              key={i}
                              className="font-mono text-xs leading-6 text-gray-400 select-none dark:text-gray-500"
                            >
                              {i + 1}
                            </div>
                          ))}
                        </div>
                        {/* 输出内容 - 带语法高亮 */}
                        <div className="min-h-[400px] flex-1 overflow-auto bg-transparent p-4 font-mono text-sm leading-6 whitespace-pre">
                          {highlightSQL(output, dialect)}
                        </div>
                      </>
                    ) : (
                      <div className="flex min-h-[400px] flex-1 items-center justify-center p-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          格式化后的结果将显示在这里...
                        </p>
                      </div>
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
                    <span>支持 MySQL、Doris SQL 语句格式化</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>支持 MongoDB 查询语句格式化</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>自动识别关键字并可选择大小写</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>支持 Ctrl+Z 撤销输入（最多10次）</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>支持多条语句批量格式化</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>固定使用4个空格缩进，格式统一</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>输入框带有行号，方便定位问题</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>点击示例数据查看各数据库的示例</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>自动语法高亮：关键字、函数、字符串、数字</span>
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


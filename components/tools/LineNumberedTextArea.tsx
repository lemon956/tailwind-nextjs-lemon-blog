'use client'

import { useLayoutEffect, useRef, useState, type ChangeEvent, type RefObject } from 'react'
import { MeasuredLineNumbers } from './MeasuredLineNumbers'

interface LineNumberedTextAreaProps {
  value: string
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void
  /** 由页面传入，沿用现有撤销 / 光标 / 聚焦逻辑 */
  textareaRef: RefObject<HTMLTextAreaElement | null>
  id?: string
  placeholder?: string
  className?: string
}

// textarea 与镜像共享的文本度量类，必须完全一致才能保证测量准确
const TEXT_METRICS_CLASS = 'font-mono text-sm leading-6'

// 空行在镜像中的占位符（不间断空格），保证空行也有一个行高
const EMPTY_LINE_PLACEHOLDER = ' '

function splitLines(value: string): string[] {
  return value.length === 0 ? [''] : value.split('\n')
}

/**
 * 带行号的软折行输入编辑器：
 * - textarea 软折行（长行自动折到下一行，无横向滚动条）
 * - 用一个隐藏镜像 div 逐行测量折行后的真实高度，行号按测量高度对齐
 * - 行号栏随 textarea 垂直滚动同步
 */
export function LineNumberedTextArea({
  value,
  onChange,
  textareaRef,
  id,
  placeholder,
  className,
}: LineNumberedTextAreaProps) {
  const gutterRef = useRef<HTMLDivElement>(null)
  const mirrorRef = useRef<HTMLDivElement>(null)
  const [heights, setHeights] = useState<number[]>([])

  const lines = splitLines(value)

  useLayoutEffect(() => {
    const mirror = mirrorRef.current
    const textarea = textareaRef.current
    if (!mirror || !textarea) return

    const measure = () => {
      // 镜像内容宽度对齐 textarea 内容宽度（clientWidth 已排除滚动条）
      mirror.style.width = `${textarea.clientWidth}px`
      const nextHeights = Array.from(mirror.children).map(
        (child) => (child as HTMLElement).offsetHeight
      )
      setHeights(nextHeights)
    }

    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(textarea)
    return () => observer.disconnect()
  }, [value, textareaRef])

  const handleScroll = () => {
    if (gutterRef.current && textareaRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }

  return (
    <div className={`relative flex overflow-hidden ${className ?? ''}`}>
      <MeasuredLineNumbers heights={heights} gutterRef={gutterRef} />
      <textarea
        ref={textareaRef}
        id={id}
        value={value}
        onChange={onChange}
        onScroll={handleScroll}
        placeholder={placeholder}
        className={`h-full flex-1 resize-none overflow-auto bg-transparent p-4 ${TEXT_METRICS_CLASS} break-words whitespace-pre-wrap text-gray-900 focus:outline-none dark:text-gray-100`}
        spellCheck={false}
      />
      {/* 隐藏测量镜像：与 textarea 完全相同的字体/行高/折行规则，仅用于逐行测高 */}
      <div
        ref={mirrorRef}
        aria-hidden
        className={`pointer-events-none invisible absolute top-0 left-0 px-4 ${TEXT_METRICS_CLASS} break-words whitespace-pre-wrap`}
      >
        {lines.map((line, index) => (
          <div key={index}>{line === '' ? EMPTY_LINE_PLACEHOLDER : line}</div>
        ))}
      </div>
    </div>
  )
}

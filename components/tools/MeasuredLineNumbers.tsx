'use client'

import type { RefObject } from 'react'

interface MeasuredLineNumbersProps {
  /** 每个可见行的像素高度，行号按此高度逐行排布以贴合内容 */
  heights: number[]
  /** 行号栏滚动容器 ref（输入框场景下用于与 textarea 同步滚动） */
  gutterRef?: RefObject<HTMLDivElement | null>
  className?: string
}

/**
 * 按测量高度渲染的行号栏：每个行号 div 的高度等于其对应内容行的渲染高度，
 * 数字顶端对齐。这样软折行（行变高）或折叠（行消失）都能与内容 1:1 对齐。
 */
export function MeasuredLineNumbers({ heights, gutterRef, className }: MeasuredLineNumbersProps) {
  const lineCount = heights.length === 0 ? 1 : heights.length

  return (
    <div
      ref={gutterRef}
      aria-hidden
      className={`min-w-12 overflow-hidden border-r border-gray-200 bg-gray-50 px-3 pt-4 text-right dark:border-gray-800 dark:bg-gray-900 ${
        className ?? ''
      }`}
    >
      {Array.from({ length: lineCount }).map((_, index) => (
        <div
          key={index}
          style={heights[index] != null ? { height: `${heights[index]}px` } : undefined}
          className="font-mono text-xs leading-6 text-gray-400 select-none dark:text-gray-500"
        >
          {index + 1}
        </div>
      ))}
    </div>
  )
}

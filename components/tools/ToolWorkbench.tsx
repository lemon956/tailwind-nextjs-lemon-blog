import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Tone = 'neutral' | 'success' | 'danger' | 'warning' | 'info'

const toneClasses: Record<Tone, string> = {
  neutral:
    'border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300',
  success:
    'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200',
  danger:
    'border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200',
  warning:
    'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200',
  info: 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-200',
}

const buttonVariantClasses = {
  primary:
    'border-sky-600 bg-sky-600 text-white hover:border-sky-500 hover:bg-sky-500 dark:border-sky-500 dark:bg-sky-500 dark:hover:border-sky-400 dark:hover:bg-sky-400',
  secondary:
    'border-gray-300 bg-white text-gray-800 hover:border-gray-400 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-gray-600 dark:hover:bg-gray-800',
  muted:
    'border-gray-200 bg-gray-100 text-gray-700 hover:border-gray-300 hover:bg-gray-200 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-700 dark:hover:bg-gray-700',
  success:
    'border-emerald-600 bg-emerald-600 text-white hover:border-emerald-500 hover:bg-emerald-500 dark:border-emerald-500 dark:bg-emerald-500 dark:hover:border-emerald-400 dark:hover:bg-emerald-400',
  warning:
    'border-amber-500 bg-amber-500 text-white hover:border-amber-400 hover:bg-amber-400 dark:border-amber-500 dark:bg-amber-500 dark:hover:border-amber-400 dark:hover:bg-amber-400',
  danger:
    'border-red-600 bg-red-600 text-white hover:border-red-500 hover:bg-red-500 dark:border-red-500 dark:bg-red-500 dark:hover:border-red-400 dark:hover:bg-red-400',
}

interface ToolWorkbenchProps {
  title: string
  description: string
  statusLabel: string
  statusTone?: Tone
  toolbar: ReactNode
  feedback?: ReactNode
  children: ReactNode
  notes?: ReactNode
}

interface ToolPanelProps {
  title: string
  meta?: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
  contentClassName?: string
}

interface ToolNoticeProps {
  tone?: Tone
  title?: string
  children: ReactNode
}

interface ToolButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof buttonVariantClasses
}

export function ToolWorkbench({
  title,
  description,
  statusLabel,
  statusTone = 'neutral',
  toolbar,
  feedback,
  children,
  notes,
}: ToolWorkbenchProps) {
  return (
    <div className="relative right-1/2 left-1/2 -mr-[50vw] -ml-[50vw] w-screen">
      <div className="mx-auto max-w-[96vw] px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200 pt-5 pb-4 dark:border-gray-800">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="mb-2 text-xs font-semibold tracking-[0.18em] text-sky-600 uppercase dark:text-sky-400">
                Developer Workbench
              </p>
              <h1 className="text-3xl leading-10 font-extrabold tracking-tight text-gray-950 sm:text-4xl dark:text-gray-50">
                {title}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600 dark:text-gray-400">
                {description}
              </p>
            </div>
            <div
              className={`w-fit rounded-md border px-3 py-1.5 text-xs font-semibold ${toneClasses[statusTone]}`}
            >
              {statusLabel}
            </div>
          </div>
        </div>

        <div className="py-5">
          <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50/80 p-3 shadow-sm dark:border-gray-800 dark:bg-gray-900/80">
            <div className="flex flex-wrap items-center gap-2">{toolbar}</div>
          </div>

          {feedback && <div className="mb-4 space-y-3">{feedback}</div>}

          <div className="grid gap-4 xl:grid-cols-2">{children}</div>

          {notes && (
            <div className="mt-5 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              {notes}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function ToolPanel({
  title,
  meta,
  actions,
  children,
  className = '',
  contentClassName = '',
}: ToolPanelProps) {
  return (
    <section
      className={`min-w-0 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950 ${className}`}
    >
      <div className="flex min-h-12 flex-wrap items-center justify-between gap-2 border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-gray-950 dark:text-gray-50">{title}</h2>
          {meta && <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{meta}</div>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      <div className={`min-h-[440px] ${contentClassName}`}>{children}</div>
    </section>
  )
}

export function ToolNotice({ tone = 'info', title, children }: ToolNoticeProps) {
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${toneClasses[tone]}`}>
      {title && <div className="mb-1 font-semibold">{title}</div>}
      <div className="leading-6">{children}</div>
    </div>
  )
}

export function ToolButton({
  variant = 'secondary',
  className = '',
  type = 'button',
  ...props
}: ToolButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-10 items-center justify-center rounded-md border px-3.5 py-2 text-sm font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${buttonVariantClasses[variant]} ${className}`}
      {...props}
    />
  )
}

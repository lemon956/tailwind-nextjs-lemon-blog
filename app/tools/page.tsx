import { genPageMetadata } from 'app/seo'
import toolsData from '@/data/toolsData'
import Link from '@/components/Link'
import Image from '@/components/Image'

export const metadata = genPageMetadata({ title: 'Tools' })

const ToolCard = ({
  title,
  description,
  href,
  icon,
}: {
  title: string
  description: string
  href: string
  icon: string
}) => {
  // 判断是否为本地图标文件
  const isLocalIcon = icon.startsWith('/')

  return (
    <Link
      href={href}
      className="group block rounded-lg border border-gray-200 bg-white p-6 transition-colors duration-200 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className="flex items-start space-x-4">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center">
          {isLocalIcon ? (
            <Image
              src={icon}
              alt={`${title} icon`}
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
            />
          ) : (
            <span className="text-2xl">{icon}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="group-hover:text-primary-500 dark:group-hover:text-primary-400 text-lg font-semibold text-gray-900 transition-colors duration-200 dark:text-gray-100">
            {title}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
            {description}
          </p>
        </div>
        <div className="flex-shrink-0">
          <svg
            className="group-hover:text-primary-500 dark:group-hover:text-primary-400 h-4 w-4 text-gray-400 transition-colors duration-200"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </div>
      </div>
    </Link>
  )
}

export default function Tools() {
  return (
    <>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        <div className="space-y-2 pt-6 pb-8 md:space-y-5">
          <h1 className="text-3xl leading-9 font-extrabold tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14 dark:text-gray-100">
            工具箱
          </h1>
          <p className="text-lg leading-7 text-gray-500 dark:text-gray-400">
            精选的开发工具、设计资源和学习平台，助力提升工作效率
          </p>
        </div>

        <div className="py-12">
          <div className="space-y-12">
            {toolsData.map((group) => (
              <div key={group.category}>
                <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {group.category}
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {group.tools.map((tool) => (
                    <ToolCard
                      key={tool.title}
                      title={tool.title}
                      description={tool.description}
                      href={tool.href}
                      icon={tool.icon}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

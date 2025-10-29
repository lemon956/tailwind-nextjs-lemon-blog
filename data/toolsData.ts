interface ToolItem {
  title: string
  description: string
  href: string
  icon: string
}

interface ToolGroup {
  category: string
  tools: ToolItem[]
}

const toolsData: ToolGroup[] = [
  {
    category: '网页工具',
    tools: [
      {
        title: 'JSON格式化',
        description: 'JSON 格式化、压缩、验证工具',
        href: '/tools/json-formatter',
        icon: '/static/favicons/tools_icon/json.svg',
      },
      {
        title: 'SQL格式化',
        description: '支持 MySQL、MongoDB、Doris 等多种数据库语法',
        href: '/tools/sql-formatter',
        icon: '/static/favicons/tools_icon/sql.svg',
      },
      {
        title: 'IP地址查询',
        description: '致力于普及 IPv6 ,推进 IPv6 规模部署和应用',
        href: 'https://ipw.cn/',
        icon: '/static/favicons/tools_icon/ipw.ico',
      },
    ],
  },
]

export default toolsData

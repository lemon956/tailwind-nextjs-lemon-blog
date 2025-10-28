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
        title: 'Json',
        description: 'json格式化',
        href: '/tools/json-formatter',
        icon: '/static/favicons/tools_icon/json.ico',
      },
      {
        title: 'IP地址查询',
        description: '致力于普及 IPv6 ,推进 IPv6 规模部署和应用',
        href: 'https://ipw.cn/',
        icon: '/static/favicons/tools_icon/ipw.ico',
      },
      {
        title: 'SQL美化',
        description: 'SQL 格式化|压缩一体',
        href: 'https://www.sojson.com/sql.html',
        icon: '/static/favicons/tools_icon/sojson.ico',
      },
    ],
  },
]

export default toolsData

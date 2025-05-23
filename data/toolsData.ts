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
    category: '开发工具',
    tools: [
      {
        title: 'Json',
        description: 'json格式化',
        href: 'https://json.cn',
        icon: '/static/favicons/tools_icon/sojson.png',
      },
    ],
  },
  {
    category: '网络工具',
    tools: [
      {
        title: 'IP地址查询',
        description: '致力于普及 IPv6 ,推进 IPv6 规模部署和应用',
        href: 'https://ipw.cn/',
        icon: '🌐',
      },
    ],
  },
  {
    category: '设计工具',
    tools: [
      {
        title: 'Figma',
        description: '协作式界面设计工具',
        href: 'https://figma.com',
        icon: '🎨',
      },
      {
        title: 'Canva',
        description: '在线图形设计平台',
        href: 'https://canva.com',
        icon: '🖼️',
      },
      {
        title: 'Unsplash',
        description: '高质量免费图片库',
        href: 'https://unsplash.com',
        icon: '📷',
      },
      {
        title: 'Dribbble',
        description: '设计师作品展示和灵感社区',
        href: 'https://dribbble.com',
        icon: '🏀',
      },
    ],
  },
  {
    category: '学习资源',
    tools: [
      {
        title: 'MDN Web Docs',
        description: '最权威的前端开发文档',
        href: 'https://developer.mozilla.org',
        icon: '📚',
      },
      {
        title: 'freeCodeCamp',
        description: '免费的编程学习平台',
        href: 'https://freecodecamp.org',
        icon: '🎓',
      },
      {
        title: 'Coursera',
        description: '在线课程学习平台',
        href: 'https://coursera.org',
        icon: '🎯',
      },
      {
        title: 'YouTube',
        description: '丰富的编程教学视频',
        href: 'https://youtube.com',
        icon: '📺',
      },
    ],
  },
  {
    category: '效率工具',
    tools: [
      {
        title: 'Notion',
        description: '全能的笔记和协作工具',
        href: 'https://notion.so',
        icon: '📝',
      },
      {
        title: 'Trello',
        description: '可视化项目管理工具',
        href: 'https://trello.com',
        icon: '📋',
      },
      {
        title: 'Slack',
        description: '团队沟通协作平台',
        href: 'https://slack.com',
        icon: '💬',
      },
      {
        title: 'Google Drive',
        description: '云端存储和文档协作',
        href: 'https://drive.google.com',
        icon: '☁️',
      },
    ],
  },
]

export default toolsData

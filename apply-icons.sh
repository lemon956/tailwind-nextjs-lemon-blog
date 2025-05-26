#!/bin/bash

echo "🍋 应用 Lemon's Blog 图标文件..."

# 检查临时图标目录是否存在
if [ ! -d "temp_icons" ]; then
    echo "❌ 错误: 找不到 temp_icons 目录"
    echo "请先运行 ./generate-icons.sh <source-image.png> 生成图标"
    exit 1
fi

# 备份原有图标
echo "💾 备份原有图标..."
if [ -d "public/static/favicons" ]; then
    cp -r public/static/favicons public/static/favicons_backup_$(date +%Y%m%d_%H%M%S)
    echo "✅ 原有图标已备份到 favicons_backup_$(date +%Y%m%d_%H%M%S)"
fi

# 复制新图标到正确位置
echo "📁 复制新图标文件..."
cp temp_icons/favicon.ico public/static/favicons/
cp temp_icons/favicon-16x16.png public/static/favicons/
cp temp_icons/favicon-32x32.png public/static/favicons/
cp temp_icons/apple-touch-icon.png public/static/favicons/
cp temp_icons/android-chrome-96x96.png public/static/favicons/
cp temp_icons/mstile-150x150.png public/static/favicons/
cp temp_icons/safari-pinned-tab.svg public/static/favicons/
cp temp_icons/site.webmanifest public/static/favicons/
cp temp_icons/browserconfig.xml public/static/favicons/

# 更新网站Logo
echo "🏷️ 更新网站Logo..."
cp temp_icons/logo.svg data/

# 更新主题色配置
echo "🎨 更新主题色配置..."

# 更新 app/layout.tsx 中的主题色
sed -i 's/color="#5bbad5"/color="#FFD700"/g' app/layout.tsx
sed -i 's/content="#000000"/content="#FFD700"/g' app/layout.tsx

echo "✅ 图标应用完成！"
echo ""
echo "📋 已更新的文件:"
echo "   • public/static/favicons/ (所有图标文件)"
echo "   • data/logo.svg (网站Logo)"
echo "   • app/layout.tsx (主题色)"
echo ""
echo "🔄 建议操作:"
echo "   1. 重启开发服务器: npm run dev 或 yarn dev"
echo "   2. 清除浏览器缓存以查看新图标"
echo "   3. 检查各种设备上的图标显示效果"
echo ""
echo "🗑️ 清理临时文件:"
echo "   rm -rf temp_icons" 
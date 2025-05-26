#!/bin/bash

# 图标生成脚本
# 使用方法: ./generate-icons.sh source-image.png

if [ $# -eq 0 ]; then
    echo "使用方法: $0 <source-image.png>"
    echo "请提供源图片文件路径"
    exit 1
fi

SOURCE_IMAGE="$1"

if [ ! -f "$SOURCE_IMAGE" ]; then
    echo "错误: 找不到源图片文件 $SOURCE_IMAGE"
    exit 1
fi

echo "🍋 开始生成 Lemon's Blog 图标文件..."

# 创建输出目录
mkdir -p temp_icons

# 生成各种尺寸的PNG图标
echo "📱 生成PNG图标..."
convert "$SOURCE_IMAGE" -resize 16x16 temp_icons/favicon-16x16.png
convert "$SOURCE_IMAGE" -resize 32x32 temp_icons/favicon-32x32.png
convert "$SOURCE_IMAGE" -resize 96x96 temp_icons/android-chrome-96x96.png
convert "$SOURCE_IMAGE" -resize 150x150 temp_icons/mstile-150x150.png
convert "$SOURCE_IMAGE" -resize 180x180 temp_icons/apple-touch-icon.png

# 生成ICO文件（包含多个尺寸）
echo "🖼️ 生成ICO文件..."
convert "$SOURCE_IMAGE" \( -clone 0 -resize 16x16 \) \( -clone 0 -resize 32x32 \) \( -clone 0 -resize 48x48 \) -delete 0 temp_icons/favicon.ico

# 生成SVG版本（用于Safari pinned tab）
echo "🎨 生成SVG文件..."
# 创建一个简化的SVG版本
cat > temp_icons/safari-pinned-tab.svg << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 100">
  <defs>
    <style>
      .lemon-shape { fill: #000000; }
    </style>
  </defs>
  <g class="lemon-shape">
    <!-- 简化的柠檬形状 -->
    <ellipse cx="50" cy="55" rx="25" ry="30"/>
    <ellipse cx="45" cy="25" rx="8" ry="4" transform="rotate(-30 45 25)"/>
    <path d="M45 25 Q50 15 60 20 Q65 25 55 30" stroke="none"/>
  </g>
</svg>
EOF

# 生成网站Logo SVG
echo "🏷️ 生成网站Logo..."
cat > temp_icons/logo.svg << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="40" height="40">
  <defs>
    <linearGradient id="lemonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FFD700;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#FFA500;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="leafGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#32CD32;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#228B22;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- 柠檬主体 -->
  <ellipse cx="50" cy="55" rx="25" ry="30" fill="url(#lemonGradient)" stroke="#DAA520" stroke-width="2"/>
  
  <!-- 高光 -->
  <ellipse cx="42" cy="45" rx="6" ry="10" fill="#FFFF99" opacity="0.6"/>
  
  <!-- 叶子 -->
  <ellipse cx="45" cy="25" rx="8" ry="4" fill="url(#leafGradient)" transform="rotate(-30 45 25)"/>
  
  <!-- 茎 -->
  <path d="M45 25 Q50 15 60 20" stroke="url(#leafGradient)" stroke-width="3" fill="none" stroke-linecap="round"/>
  
  <!-- 纹理点 -->
  <circle cx="55" cy="50" r="1" fill="#DAA520" opacity="0.5"/>
  <circle cx="60" cy="60" r="1" fill="#DAA520" opacity="0.5"/>
  <circle cx="52" cy="65" r="1" fill="#DAA520" opacity="0.5"/>
  <circle cx="45" cy="60" r="1" fill="#DAA520" opacity="0.5"/>
</svg>
EOF

echo "📝 生成配置文件..."

# 生成 site.webmanifest
cat > temp_icons/site.webmanifest << 'EOF'
{
  "name": "Lemon's Blog",
  "short_name": "Lemon's Blog",
  "icons": [
    {
      "src": "/static/favicons/android-chrome-96x96.png",
      "sizes": "96x96",
      "type": "image/png"
    }
  ],
  "theme_color": "#FFD700",
  "background_color": "#FFFEF7",
  "display": "standalone"
}
EOF

# 生成 browserconfig.xml
cat > temp_icons/browserconfig.xml << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
    <msapplication>
        <tile>
            <square150x150logo src="/static/favicons/mstile-150x150.png"/>
            <TileColor>#FFD700</TileColor>
        </tile>
    </msapplication>
</browserconfig>
EOF

echo "✅ 图标生成完成！"
echo ""
echo "📁 生成的文件列表:"
ls -la temp_icons/
echo ""
echo "🔄 要应用这些图标，请运行:"
echo "   ./apply-icons.sh" 
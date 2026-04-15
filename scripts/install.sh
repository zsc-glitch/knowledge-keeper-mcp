#!/bin/bash

# Knowledge Keeper MCP 安装脚本
# 自动配置 Claude Code / Cursor / Gemini CLI

echo "🧠 Knowledge Keeper MCP 安装脚本"
echo "=================================="

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 请先安装 Node.js (>=18)"
    exit 1
fi

echo "✅ Node.js: $(node -v)"

# 安装包
echo ""
echo "📦 安装 knowledge-keeper-mcp..."
npm install -g @zsc-glitch/knowledge-keeper-mcp@alpha

# 选择配置工具
echo ""
echo "选择要配置的工具:"
echo "1) Claude Code"
echo "2) Cursor"
echo "3) Gemini CLI"
echo "4) Windsurf"
echo "5) 全部"
echo ""
read -p "输入选项 (1-5): " choice

case $choice in
    1)
        configure_claude_code
        ;;
    2)
        configure_cursor
        ;;
    3)
        configure_gemini_cli
        ;;
    4)
        configure_windsurf
        ;;
    5)
        configure_claude_code
        configure_cursor
        configure_gemini_cli
        configure_windsurf
        ;;
    *)
        echo "无效选项"
        exit 1
        ;;
esac

echo ""
echo "🎉 安装完成！"
echo ""
echo "使用示例:"
echo "  在 Claude Code 中: claude"
echo "  然后输入: 使用 knowledge_save 保存一个知识点"
echo ""

# 配置函数
configure_claude_code() {
    echo "配置 Claude Code..."
    
    CONFIG_DIR="$HOME/.claude"
    CONFIG_FILE="$CONFIG_DIR/claude_desktop_config.json"
    
    mkdir -p "$CONFIG_DIR"
    
    if [ -f "$CONFIG_FILE" ]; then
        # 已存在配置，追加
        echo "  已有配置文件，需要手动添加"
        echo "  请在 $CONFIG_FILE 中添加:"
        echo ""
        echo '  "knowledge-keeper": {
    "command": "npx",
    "args": ["@zsc-glitch/knowledge-keeper-mcp"]
  }'
    else
        # 创建新配置
        echo '{"mcpServers":{"knowledge-keeper":{"command":"npx","args":["@zsc-glitch/knowledge-keeper-mcp"]}}}' > "$CONFIG_FILE"
        echo "  ✅ 配置完成"
    fi
}

configure_cursor() {
    echo "配置 Cursor..."
    
    CONFIG_FILE="$HOME/.cursor/mcp.json"
    
    mkdir -p "$HOME/.cursor"
    
    if [ -f "$CONFIG_FILE" ]; then
        echo "  已有配置文件，需要手动添加"
    else
        echo '{"mcpServers":{"knowledge-keeper":{"command":"npx","args":["@zsc-glitch/knowledge-keeper-mcp"]}}}' > "$CONFIG_FILE"
        echo "  ✅ 配置完成"
    fi
}

configure_gemini_cli() {
    echo "配置 Gemini CLI..."
    
    CONFIG_FILE="$HOME/.gemini/mcp.json"
    
    mkdir -p "$HOME/.gemini"
    
    if [ -f "$CONFIG_FILE" ]; then
        echo "  已有配置文件，需要手动添加"
    else
        echo '{"mcpServers":{"knowledge-keeper":{"command":"npx","args":["@zsc-glitch/knowledge-keeper-mcp"]}}}' > "$CONFIG_FILE"
        echo "  ✅ 配置完成"
    fi
}

configure_windsurf() {
    echo "配置 Windsurf..."
    
    CONFIG_FILE="$HOME/.windsurf/mcp.json"
    
    mkdir -p "$HOME/.windsurf"
    
    if [ -f "$CONFIG_FILE" ]; then
        echo "  已有配置文件，需要手动添加"
    else
        echo '{"mcpServers":{"knowledge-keeper":{"command":"npx","args":["@zsc-glitch/knowledge-keeper-mcp"]}}}' > "$CONFIG_FILE"
        echo "  ✅ 配置完成"
    fi
}
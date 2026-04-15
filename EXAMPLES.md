# 使用示例

## 基础操作

### 保存知识点

```javascript
// Claude Code 中输入:
使用 knowledge_save 保存一个概念知识点:
标题: "什么是MCP"
内容: "MCP (Model Context Protocol) 是一种让AI助手与外部工具交互的协议标准"
标签: ["MCP", "协议", "AI工具"]
```

### 搜索知识点

```javascript
// 关键词搜索
使用 knowledge_search 搜索 "MCP"

// 语义搜索
使用 knowledge_semantic_search 搜索 "如何让AI与工具交互"

// BM25检索
使用 knowledge_bm25_search 搜索 "协议"
```

### 获取知识点

```javascript
// 获取单个知识点
使用 knowledge_get 获取知识点 "kp_123"
```

### 更新知识点

```javascript
// 更新内容
使用 knowledge_update 更新知识点 "kp_123":
内容: "MCP是由Anthropic提出的协议..."
添加标签: ["Anthropic"]
```

### 删除知识点

```javascript
// 删除知识点
使用 knowledge_delete 删除知识点 "kp_123"
```

---

## 知识关联

### 创建关联

```javascript
// 创建知识点之间的关联
使用 knowledge_link 创建关联:
源知识点: "kp_123" (什么是MCP)
目标知识点: "kp_456" (Claude Code使用指南)
关联类型: "references"
双向: true
```

### 查询关联

```javascript
// 查询某知识点的所有关联
使用 knowledge_get_linked 查询知识点 "kp_123":
方向: both
```

### 删除关联

```javascript
// 删除关联
使用 knowledge_unlink 删除关联:
源知识点: "kp_123"
目标知识点: "kp_456"
```

---

## 知识图谱

### 可视化图谱

```javascript
// 从某个知识点开始构建图谱
使用 knowledge_graph 构建图谱:
根节点: "kp_123"
深度: 3

// 获取全局图谱
使用 knowledge_graph 获取全局图谱:
最小关联数: 2
```

---

## 导入导出

### 导出知识库

```javascript
// 导出为JSON
使用 knowledge_export 导出知识库:
格式: json
数量: 100

// 导出为Markdown（Obsidian格式）
使用 knowledge_export 导出:
格式: markdown

// 导出为CSV
使用 knowledge_export 导出:
格式: csv
```

### 导入知识点

```javascript
// 从JSON导入
使用 knowledge_import 导入:
格式: json
内容: '{"knowledge": [{"title": "...", "content": "..."}]}'

// 从Markdown导入
使用 knowledge_import 导入:
格式: markdown
内容: '# 知识标题\n\n知识点内容...'
```

---

## 批量操作

### 批量删除

```javascript
// 删除特定类型的知识点
使用 knowledge_batch 批量删除:
搜索条件: "todo"
数量: 50
```

### 批量添加标签

```javascript
// 为多个知识点添加标签
使用 knowledge_batch 批量添加标签:
知识点ID: ["kp_1", "kp_2", "kp_3"]
标签: ["项目相关"]
```

---

## Obsidian同步

### 同步状态

```javascript
// 查看同步状态
使用 knowledge_sync 查看同步状态
```

### 从Obsidian拉取

```javascript
// 从Obsidian vault拉取知识点
使用 knowledge_sync 从Obsidian拉取:
源路径: "/path/to/obsidian/vault"
```

### 推送到Obsidian

```javascript
// 推送知识点到Obsidian vault
使用 knowledge_sync 推送到Obsidian:
目标路径: "/path/to/obsidian/vault"
```

---

## 知识合并

### 合并重复知识点

```javascript
// 合并两个相似的知识点
使用 knowledge_merge 合并知识点:
主知识点: "kp_123"
次要知识点: "kp_456"
模式: "delete_secondary"  // 合并内容后删除次要知识点
```

---

## 统计

### 查看标签

```javascript
// 列出所有标签
使用 knowledge_tags 列出标签
```

### 知识回顾

```javascript
// 查看本周统计
使用 knowledge_review 知识回顾:
时间范围: week

// 查看今日统计
使用 knowledge_review:
时间范围: today
```

### BM25统计

```javascript
// 查看BM25索引统计
使用 knowledge_bm25_stats 查看统计
```

---

## 版本历史

### 查看版本

```javascript
// 查看知识点的版本历史
使用 knowledge_versions 查看版本:
知识点ID: "kp_123"
```

---

Made with 🧠 by [小影](https://github.com/zsc-glitch)
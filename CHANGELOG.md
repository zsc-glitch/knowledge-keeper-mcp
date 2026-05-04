# Changelog

All notable changes to this project will be documented in this file.

## [1.7.0] - 2026-05-05

### 🆕 Knowledge Context Tool
- **knowledge_context** tool — Knowledge neighborhood explorer: given a knowledge point ID, automatically gathers full contextual neighborhood
  - **3 depth levels**: quick (links only), standard (+ shared tags), deep (+ similar titles)
  - Traverses direct links, reverse links, shared tags, and title similarity
  - Score-sorted results with relation reasons and relevance percentages
  - Configurable max results (3-30, default 10)
  - Valuable for AI agents: single-call context building replaces serial `search → get → get-linked` queries
- Total tools: 31 → **32**

### Why knowledge_context?
AI agents working with knowledge bases often need to understand the "neighborhood" around a concept. Previously this required:
1. `knowledge_get(id)` → get the target
2. `knowledge_get_linked(id)` → get linked items
3. `knowledge_search(query)` → find related by topic
4. Manual synthesis of results

Now, `knowledge_context` does all of this in a single call with intelligent scoring and ranking.

## [1.6.0] - 2026-05-04

### 🆕 Duplicate Detection Tool
- **knowledge_duplicates** tool — Detect duplicate or similar knowledge points with configurable similarity threshold
  - Supports title-only, content-only, or both (weighted: title 60%, content 40%)
  - Jaccard similarity on word sets
  - Returns groups of similar items with merge suggestions
  - Integrates with `knowledge_merge` for one-click deduplication
- Total tools: 31 → **32**

### Changed
- Extracted `loadAllEntries()` to core.ts as public export (was 6 duplicate private implementations)
- Removed 263 lines of duplicate code
- Fixed unused `searchKnowledge` import in hybrid-search.ts

## [1.5.1] - 2026-05-04

### 🔧 Refactor: Extract loadAllEntries to core.ts

Consolidated 6 duplicate `loadAllEntries()` implementations into a single public export from `core.ts`. Also fixed one additional `searchKnowledge({ query: "" })` in `resources/index.ts` that was missed in v1.5.0.

**Changed:**
- `loadAllEntries()` is now a public export from `core.ts` (reuses `loadIndex` with its 5-second cache)
- Removed duplicate implementations from: analytics, cloud-sync, resources, tools/export, tools/graph-build, tools/recent, tools/sync
- Fixed `resources/index.ts` using `searchKnowledge({ query: "" })` for type listing (14th instance)
- Net: -263 lines of duplicate code

## [1.5.0] - 2026-05-04

### 🚀 Performance Optimization — Eliminate searchKnowledge Empty Query Anti-Pattern

Replaced all 13 instances of `searchKnowledge({ query: "", limit: N })` with direct index reads across 8 files. This anti-pattern caused unnecessary search/filter/sort overhead for operations that simply need "all entries".

**Changed files:**
- `tools/recent.ts` — Direct index read + new `sort_by` param (updated/created) + timestamp precision + total count
- `tools/batch.ts` — Implemented missing `update_type` action (was defined in schema but not in switch)
- `tools/export.ts` — Direct index read for bulk export (2-5x faster for large knowledge bases)
- `analytics.ts` — 3 calls → `loadAllEntries()` (overview/insights/timeline)
- `tools/graph-build.ts` — 1 call → `loadAllEntries()`
- `tools/sync.ts` — 3 calls → `loadAllEntries()`
- `cloud-sync.ts` — 3 calls → `loadAllEntries()` + **loop hoisting** (load once before loop, not per iteration)

**Estimated impact:** 2-5x speedup on analytics, export, sync, and graph operations

### New Features
- `knowledge_recent` now supports `sort_by` parameter (updated/created)
- `knowledge_recent` now shows total knowledge point count
- `knowledge_recent` now displays timestamps with minute precision
- `knowledge_batch` now supports `update_type` action to change knowledge point types

### Bug Fixes
- `knowledge_batch`: `update_type` action was defined in schema but not implemented — now works
- `cloud-sync.ts`: Pull loop read index file on every iteration (O(n) file reads) → now reads once before loop

## [1.2.0] - 2026-04-27

### 🆕 Knowledge Analytics
- **knowledge_analytics_overview** tool — 知识库整体统计（项目数、标签、链接、类型分布、健康评分）
- **knowledge_analytics_insights** tool — 质量洞察（孤立项目、重复候选、连接性/覆盖度/新鲜度评分）
- **knowledge_analytics_timeline** tool — 时间线统计（每日/每周/每月创建数量）

### Changed
- Total tools: 26 → 29
- Package description updated

## [1.1.0] - 2026-04-27

### 🆕 Pro Feature: Cloud Sync
- **knowledge_sync_status** tool - 检查云同步状态
- **knowledge_sync** tool - 执行云同步（push/pull/full），端到端加密
- **knowledge_license** tool - 查看许可证和功能
- 端到端加密（AES-256-GCM），服务器无法解密用户数据
- 增量同步 + 版本追踪 + 冲突检测
- Free/Pro/Team 三档定价

### Bug Fixes
- 修复 graph-build.ts 缺失 queryEntity/saveGraph 导入
- 修复 tsconfig.json 排除测试文件

### Changed
- README 全面英文重写，国际化
- npm 关键词扩展到 18 个（覆盖主要搜索场景）
- 安装命令去掉 @alpha 标签

## [1.0.0] - 2026-04-27

### 🎉 First Stable Release
- 从 alpha 升级为正式版
- **23 MCP Tools** — 完整知识管理工具集
- 知识图谱（Phase 1）— 实体检测 + 关系可视化

## [1.0.1-alpha.1] - 2026-04-16

### Changed
- npm pkg fix 修复 bin 配置
- 重新发布 alpha 版本

## [1.0.0-alpha.1] - 2026-04-15

### Added
- **knowledge_merge** tool - 合并相似或重复的知识点
- 达成 **20 MCP Tools** 里程碑！

### Changed
- README 更新 - 添加竞品对比表格

## [0.13.0-alpha.1] - 2026-04-15

### Added
- **knowledge_sync** tool - Obsidian vault 双向同步
  - status: 查看同步状态
  - pull: 从Obsidian拉取
  - push: 推送到Obsidian
  - diff: 比较差异

## [0.12.0-alpha.1] - 2026-04-15

### Added
- **knowledge_batch** tool - 批量操作
  - 批量删除
  - 批量添加/移除标签

## [0.11.0-alpha.1] - 2026-04-15

### Added
- **knowledge_import** tool - 批量导入
  - JSON格式导入
  - Markdown格式导入（Obsidian兼容）

## [0.10.0-alpha.1] - 2026-04-15

### Added
- **knowledge_graph** tool - 知识图谱可视化
- **knowledge_export** tool - 多格式导出（JSON/Markdown/CSV）

## [0.9.0-alpha.1] - 2026-04-15

### Added
- **knowledge_link** tool - 创建知识关联
- **knowledge_unlink** tool - 删除知识关联
- **knowledge_get_linked** tool - 查询知识关联
- 关联类型: related/depends-on/references/similar/contradicts

## [0.8.0-alpha.1] - 2026-04-15

### Added
- **knowledge_bm25_stats** tool - BM25索引统计
- 达成 **11 MCP Tools**

## [0.7.0-alpha.1] - 2026-04-12

### Added
- **knowledge_review** tool - 知识回顾统计
  - today/week/month/all 时间范围
  - 各类型知识点统计
  - 最近知识点列表

## [0.6.0-alpha.1] - 2026-04-11

### Added
- BM25关键词检索功能
- **knowledge_bm25_search** tool

## [0.5.0-alpha.1] - 2026-04-11

### Added
- Obsidian vault兼容
- Backlinks格式 `[[link]]`
- aliases元数据

## [0.4.0-alpha.1] - 2026-04-10

### Added
- **knowledge_versions** tool - 版本历史
- SHA256审计日志

## [0.3.0-alpha.1] - 2026-04-10

### Added
- 7 MCP Resources
  - knowledge:///list
  - knowledge:///tags
  - knowledge:///type/concept
  - knowledge:///type/decision
  - knowledge:///type/todo
  - knowledge:///type/note
  - knowledge:///type/project

## [0.2.0-alpha.1] - 2026-04-10

### Added
- 语义搜索（TF-IDF）
- **knowledge_semantic_search** tool

## [0.1.0-alpha.1] - 2026-04-10

### Added
- 基础6 Tools
  - knowledge_save
  - knowledge_search
  - knowledge_get
  - knowledge_update
  - knowledge_delete
  - knowledge_tags

---

## 版本迭代汇总

| 版本 | Tools数量 | 发布日期 |
|------|----------|---------|
| 0.1.0 | 6 | 04-10 |
| 0.2.0 | 7 | 04-10 |
| 0.3.0 | 7 + Resources | 04-10 |
| 0.4.0 | 8 | 04-10 |
| 0.5.0 | 8 | 04-11 |
| 0.6.0 | 9 | 04-11 |
| 0.7.0 | 10 | 04-12 |
| 0.8.0 | 11 | 04-15 |
| 0.9.0 | 14 | 04-15 |
| 0.10.0 | 16 | 04-15 |
| 0.11.0 | 17 | 04-15 |
| 0.12.0 | 18 | 04-15 |
| 0.13.0 | 19 | 04-15 |
| **1.0.0** | **20** | **04-27** |
| **1.1.0** | **26** | **04-27** |

---

Made with 🧠 by [小影](https://github.com/zsc-glitch)
/**
 * knowledge_export - 导出知识库
 *
 * 支持多种格式导出：
 * - JSON（完整数据）
 * - Markdown（Obsidian格式）
 * - CSV（表格格式）
 */
import type { McpServer } from "@modelcontextprotocol/server";
export declare function registerExportTool(server: McpServer): void;

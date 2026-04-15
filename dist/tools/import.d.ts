/**
 * knowledge_import - 导入知识
 *
 * 支持从多种格式导入：
 * - JSON（批量导入）
 * - Markdown（Obsidian格式）
 */
import type { McpServer } from "@modelcontextprotocol/server";
export declare function registerImportTool(server: McpServer): void;

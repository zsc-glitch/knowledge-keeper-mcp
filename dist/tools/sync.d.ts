/**
 * knowledge_sync - 知识同步
 *
 * 支持与其他知识库同步：
 * - Git同步（远程仓库）
 * - Obsidian同步（vault路径）
 */
import type { McpServer } from "@modelcontextprotocol/server";
export declare function registerSyncTool(server: McpServer): void;

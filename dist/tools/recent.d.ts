/**
 * knowledge_recent MCP Tool
 * Get recently added/updated knowledge points
 *
 * Optimized: reads index directly instead of going through searchKnowledge,
 * avoiding unnecessary query filtering for a simple date-based listing.
 */
import type { McpServer } from "@modelcontextprotocol/server";
export declare function registerRecentTool(server: McpServer): void;

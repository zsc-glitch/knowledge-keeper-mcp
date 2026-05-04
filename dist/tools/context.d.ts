/**
 * knowledge_context MCP Tool
 * Gather contextual knowledge neighborhood for a given knowledge point.
 * Traverses links, shared tags, and similar titles to build rich context.
 */
import type { McpServer } from "@modelcontextprotocol/server";
export declare function registerContextTool(server: McpServer): void;

/**
 * Hybrid Search MCP Tool
 * Combines BM25 + Semantic using RRF (Reciprocal Rank Fusion)
 */
import type { McpServer } from "@modelcontextprotocol/server";
export declare function registerHybridSearchTool(server: McpServer): void;

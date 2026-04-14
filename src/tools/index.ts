/**
 * MCP Tools 注册
 */

import type { McpServer } from "@modelcontextprotocol/server";
import { registerSaveTool } from "./save.js";
import { registerSearchTool } from "./search.js";
import { registerSemanticSearchTool } from "./semantic-search.js";
import { registerBM25SearchTool } from "./bm25-search.js";
import { registerBM25StatsTool } from "./bm25-stats.js";
import { registerGetTool } from "./get.js";
import { registerUpdateTool } from "./update.js";
import { registerDeleteTool } from "./delete.js";
import { registerTagsTool } from "./tags.js";
import { registerVersionsTool } from "./versions.js";
import { registerReviewTool } from "./review.js";

export function registerTools(server: McpServer): void {
  registerSaveTool(server);
  registerSearchTool(server);
  registerSemanticSearchTool(server);
  registerBM25SearchTool(server);
  registerBM25StatsTool(server);
  registerGetTool(server);
  registerUpdateTool(server);
  registerDeleteTool(server);
  registerTagsTool(server);
  registerVersionsTool(server);
  registerReviewTool(server);
}
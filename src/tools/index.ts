/**
 * MCP Tools 注册
 */

import type { McpServer } from "@modelcontextprotocol/server";
import { registerSaveTool } from "./save.js";
import { registerSearchTool } from "./search.js";
import { registerSemanticSearchTool } from "./semantic-search.js";
import { registerGetTool } from "./get.js";
import { registerUpdateTool } from "./update.js";
import { registerDeleteTool } from "./delete.js";
import { registerTagsTool } from "./tags.js";
import { registerVersionsTool } from "./versions.js";

export function registerTools(server: McpServer): void {
  registerSaveTool(server);
  registerSearchTool(server);
  registerSemanticSearchTool(server);
  registerGetTool(server);
  registerUpdateTool(server);
  registerDeleteTool(server);
  registerTagsTool(server);
  registerVersionsTool(server);
}
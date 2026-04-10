/**
 * MCP Tools 注册
 */

import type { McpServer } from "@modelcontextprotocol/server";
import { registerSaveTool } from "./save.js";
import { registerSearchTool } from "./search.js";
import { registerGetTool } from "./get.js";
import { registerUpdateTool } from "./update.js";
import { registerDeleteTool } from "./delete.js";
import { registerTagsTool } from "./tags.js";

export function registerTools(server: McpServer): void {
  registerSaveTool(server);
  registerSearchTool(server);
  registerGetTool(server);
  registerUpdateTool(server);
  registerDeleteTool(server);
  registerTagsTool(server);
}
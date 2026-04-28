#!/usr/bin/env node
/**
 * Knowledge Keeper MCP Server
 * MCP 实现 - 让 knowledge-keeper 可被 Claude Code、Cursor、Gemini CLI 等调用
 */
import { McpServer, StdioServerTransport } from "@modelcontextprotocol/server";
import { registerTools } from "./tools/index.js";
import { registerResources } from "./resources/index.js";
// MCP Server 配置
const server = new McpServer({
    name: "knowledge-keeper",
    version: "0.8.0-alpha.1",
});
// 注册 Tools
registerTools(server);
// 注册 Resources
registerResources(server);
// STDIO 传输（本地优先）
const transport = new StdioServerTransport();
await server.connect(transport);
//# sourceMappingURL=index.js.map
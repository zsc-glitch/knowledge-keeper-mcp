/**
 * MCP Tools 注册
 */
import { registerSaveTool } from "./save.js";
import { registerSearchTool } from "./search.js";
import { registerSemanticSearchTool } from "./semantic-search.js";
import { registerBM25SearchTool } from "./bm25-search.js";
import { registerGetTool } from "./get.js";
import { registerUpdateTool } from "./update.js";
import { registerDeleteTool } from "./delete.js";
import { registerTagsTool } from "./tags.js";
import { registerVersionsTool } from "./versions.js";
export function registerTools(server) {
    registerSaveTool(server);
    registerSearchTool(server);
    registerSemanticSearchTool(server);
    registerBM25SearchTool(server);
    registerGetTool(server);
    registerUpdateTool(server);
    registerDeleteTool(server);
    registerTagsTool(server);
    registerVersionsTool(server);
}
//# sourceMappingURL=index.js.map
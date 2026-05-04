/**
 * MCP Tools 注册
 */
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
import { registerLinkTool } from "./link.js";
import { registerUnlinkTool } from "./unlink.js";
import { registerGetLinkedTool } from "./get-linked.js";
import { registerGraphTool } from "./graph.js";
import { registerExportTool } from "./export.js";
import { registerImportTool } from "./import.js";
import { registerBatchTool } from "./batch.js";
import { registerSyncTool } from "./sync.js";
import { registerMergeTool } from "./merge.js";
// Knowledge Graph Tools (Phase 1)
import { registerGraphBuildTool } from "./graph-build.js";
import { registerGraphQueryTool } from "./graph-query.js";
import { registerGraphVisualizeTool } from "./graph-visualize.js";
// Cloud Sync Tools (Pro)
import { registerCloudSyncTools } from "./cloud-sync.js";
// Knowledge Analytics
import { registerAnalyticsTools } from "./analytics.js";
// Hybrid Search
import { registerHybridSearchTool } from "./hybrid-search.js";
// Recent Knowledge
import { registerRecentTool } from "./recent.js";
// Duplicate Detection
import { registerDuplicatesTool } from "./duplicates.js";
// Knowledge Context
import { registerContextTool } from "./context.js";
export function registerTools(server) {
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
    registerLinkTool(server);
    registerUnlinkTool(server);
    registerGetLinkedTool(server);
    registerGraphTool(server);
    registerExportTool(server);
    registerImportTool(server);
    registerBatchTool(server);
    registerSyncTool(server);
    registerMergeTool(server);
    // Knowledge Graph Tools
    registerGraphBuildTool(server);
    registerGraphQueryTool(server);
    registerGraphVisualizeTool(server);
    // Cloud Sync (Pro)
    registerCloudSyncTools(server);
    // Analytics
    registerAnalyticsTools(server);
    // Hybrid Search
    registerHybridSearchTool(server);
    // Recent Knowledge
    registerRecentTool(server);
    // Duplicate Detection
    registerDuplicatesTool(server);
    // Knowledge Context
    registerContextTool(server);
}
//# sourceMappingURL=index.js.map
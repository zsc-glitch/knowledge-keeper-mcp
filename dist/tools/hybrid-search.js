/**
 * Hybrid Search MCP Tool
 * Combines BM25 + Semantic using RRF (Reciprocal Rank Fusion)
 */
import { z } from "zod";
import { hybridSearch } from "../hybrid-search.js";
export function registerHybridSearchTool(server) {
    server.registerTool("knowledge_hybrid_search", {
        title: "混合搜索",
        description: "混合 BM25 关键词搜索 + 语义搜索，使用 Reciprocal Rank Fusion (RRF) 融合排序。Benchmark: R@5 = 95%",
        inputSchema: z.object({
            query: z.string().describe("搜索查询"),
            limit: z.number().default(10).describe("返回结果数量"),
            bm25Weight: z.number().default(0.7).describe("BM25 权重 (0-1)"),
            semanticWeight: z.number().default(0.3).describe("语义搜索权重 (0-1)"),
        }),
    }, async (params) => {
        try {
            const results = await hybridSearch({
                query: params.query,
                limit: params.limit,
                bm25Weight: params.bm25Weight,
                semanticWeight: params.semanticWeight,
            });
            const lines = results.map((r, i) => `${i + 1}. **${r.title}** (score: ${r.score.toFixed(4)})\n   ${r.content.slice(0, 100)}...`);
            return {
                content: [
                    {
                        type: "text",
                        text: `🔍 混合搜索结果（BM25 ${params.bm25Weight} + 语义 ${params.semanticWeight}）\n\n${lines.join("\n\n") || "无结果"}\n\n📊 找到 ${results.length} 个结果`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `❌ 搜索失败: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
//# sourceMappingURL=hybrid-search.js.map
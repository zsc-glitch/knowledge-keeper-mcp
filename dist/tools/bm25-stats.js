/**
 * knowledge_bm25_stats MCP Tool
 * BM25 索引统计信息
 */
import { z } from "zod";
import { getBM25Stats } from "../bm25.js";
export function registerBM25StatsTool(server) {
    server.registerTool("knowledge_bm25_stats", {
        title: "BM25 统计",
        description: "查看 BM25 索引的统计信息（文档数、词汇表大小、平均长度等）",
        inputSchema: z.object({}),
    }, async () => {
        try {
            const stats = await getBM25Stats();
            const lastUpdateStr = stats.lastUpdate > 0
                ? new Date(stats.lastUpdate).toLocaleString("zh-CN")
                : "无";
            return {
                content: [
                    {
                        type: "text",
                        text: `📊 BM25 索引统计

| 指标 | 数值 |
|------|------|
| 文档总数 | ${stats.docCount} |
| 词汇表大小 | ${stats.termCount} |
| 平均文档长度 | ${stats.avgDocLength} tokens |
| 最后更新 | ${lastUpdateStr} |

**参数配置**
- K1 (词频饱和): 1.5
- B (长度归一化): 0.75
`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `❌ 获取 BM25 统计失败: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
//# sourceMappingURL=bm25-stats.js.map
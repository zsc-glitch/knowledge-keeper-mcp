/**
 * knowledge_review MCP Tool
 * 知识回顾 - 查看近期知识点统计
 */
import { z } from "zod";
import { reviewKnowledge } from "../core.js";
export function registerReviewTool(server) {
    server.registerTool("knowledge_review", {
        title: "知识回顾",
        description: "查看近期知识点统计，支持今天/本周/本月/全部",
        inputSchema: z.object({
            period: z.enum(["today", "week", "month", "all"]).optional().describe("回顾周期（默认week）"),
            type: z.enum(["concept", "decision", "todo", "note", "project"]).optional().describe("筛选类型"),
        }),
    }, async (params) => {
        try {
            const result = await reviewKnowledge({
                period: params.period,
                type: params.type,
            });
            // 格式化统计
            const statsText = Object.entries(result.stats)
                .filter(([, count]) => count > 0)
                .map(([type, count]) => `  - ${type}: ${count}`)
                .join("\n");
            // 格式化近期知识点
            const recentText = result.recent.length > 0
                ? result.recent
                    .map((kp, i) => `${i + 1}. **${kp.title}** (${kp.type})\n   创建: ${kp.created.slice(0, 10)}\n   标签: ${kp.tags.join(", ") || "无"}`)
                    .join("\n\n")
                : "无近期知识点";
            return {
                content: [
                    {
                        type: "text",
                        text: `📊 知识回顾 (${params.period || "week"})\n\n## 统计\n${statsText || "  无知识点"}\n\n## 近期知识点 (前10)\n\n${recentText}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `❌ 知识回顾失败: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
//# sourceMappingURL=review.js.map
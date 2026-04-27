/**
 * Knowledge Analytics MCP Tools
 * Overview, insights, and timeline analytics
 */
import { z } from "zod";
import { getAnalyticsOverview, getAnalyticsInsights, getAnalyticsTimeline } from "../analytics.js";
export function registerAnalyticsTools(server) {
    // Overview
    server.registerTool("knowledge_analytics_overview", {
        title: "知识库概览",
        description: "获取知识库的整体统计数据：项目数、标签数、链接数、类型分布、健康评分等",
        inputSchema: z.object({}),
    }, async () => {
        try {
            const overview = await getAnalyticsOverview("");
            const typeLines = Object.entries(overview.typesBreakdown)
                .map(([type, count]) => `  - ${type}: ${count}`)
                .join("\n");
            const tagLines = overview.topTags
                .map(t => `  - ${t.tag}: ${t.count}`)
                .join("\n");
            return {
                content: [
                    {
                        type: "text",
                        text: `📊 知识库概览\n\n📋 基本统计:\n- 总项目数: ${overview.totalItems}\n- 标签种类: ${overview.totalTags}\n- 链接总数: ${overview.totalLinks}\n- 健康评分: ${overview.knowledgeHealth}/100\n- 平均内容长度: ${overview.averageContentLength} 字符\n\n📦 类型分布:\n${typeLines || "  (无)"}\n\n🏷️ 热门标签:\n${tagLines || "  (无)"}\n\n📅 时间范围:\n- 最早: ${overview.oldestItem || "无"}\n- 最新: ${overview.newestItem || "无"}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `❌ 获取概览失败: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
    // Insights
    server.registerTool("knowledge_analytics_insights", {
        title: "知识库洞察",
        description: "获取知识库质量洞察：孤立项目、未标记项目、过期项目、重复候选、连接性评分等",
        inputSchema: z.object({}),
    }, async () => {
        try {
            const insights = await getAnalyticsInsights("");
            return {
                content: [
                    {
                        type: "text",
                        text: `🔍 知识库洞察\n\n⚠️ 问题项:\n- 孤立项目（无标签无链接）: ${insights.orphanItems}\n- 未标记项目: ${insights.untaggedItems}\n- 未链接项目: ${insights.unlinkedItems}\n- 重复候选: ${insights.duplicateCandidates}\n- 过期项目（30天未更新）: ${insights.staleItems}\n- 复习逾期: ${insights.reviewOverdue}\n\n📊 质量评分:\n- 🔗 连接性: ${insights.connectivityScore}/100\n- 🏷️ 覆盖度: ${insights.coverageScore}/100\n- 🆕 新鲜度: ${insights.freshnessScore}/100\n\n💡 建议:\n${insights.orphanItems > 0 ? `- 为 ${insights.orphanItems} 个孤立项目添加标签或链接\n` : ""}${insights.staleItems > 0 ? `- 复习或更新 ${insights.staleItems} 个过期项目\n` : ""}${insights.duplicateCandidates > 0 ? `- 检查 ${insights.duplicateCandidates} 组可能重复的项目\n` : ""}${insights.untaggedItems > 0 ? `- 为 ${insights.untaggedItems} 个项目添加标签\n` : ""}${insights.connectivityScore > 70 && insights.coverageScore > 70 ? "✅ 知识库整体健康度良好！\n" : ""}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `❌ 获取洞察失败: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
    // Timeline
    server.registerTool("knowledge_analytics_timeline", {
        title: "知识库时间线",
        description: "获取知识库的时间线统计：每日/每周/每月创建数量",
        inputSchema: z.object({
            granularity: z.enum(["daily", "weekly", "monthly"]).default("monthly").describe("时间粒度"),
        }),
    }, async (params) => {
        try {
            const timeline = await getAnalyticsTimeline("");
            const data = params.granularity === "daily" ? timeline.daily
                : params.granularity === "weekly" ? timeline.weekly
                    : timeline.monthly;
            const sortedEntries = Object.entries(data).sort(([a], [b]) => a.localeCompare(b));
            const lines = sortedEntries.map(([date, count]) => `  ${date}: ${"█".repeat(Math.min(count, 30))} (${count})`);
            return {
                content: [
                    {
                        type: "text",
                        text: `📅 知识库时间线（${params.granularity === "daily" ? "每日" : params.granularity === "weekly" ? "每周" : "每月"}）\n\n${lines.join("\n") || "  (无数据)"}\n\n📈 总计: ${Object.values(data).reduce((a, b) => a + b, 0)} 项`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `❌ 获取时间线失败: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
//# sourceMappingURL=analytics.js.map
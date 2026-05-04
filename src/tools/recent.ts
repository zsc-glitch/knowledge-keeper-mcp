/**
 * knowledge_recent MCP Tool
 * Get recently added/updated knowledge points
 * 
 * Optimized: reads index directly instead of going through searchKnowledge,
 * avoiding unnecessary query filtering for a simple date-based listing.
 */

import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { loadAllEntries, type KnowledgeType } from "../core.js";

export function registerRecentTool(server: McpServer): void {
  server.registerTool(
    "knowledge_recent",
    {
      title: "最近知识",
      description: "获取最近添加或更新的知识点，按时间倒序排列。用于快速回顾最近的工作内容。",
      inputSchema: z.object({
        limit: z.number().optional().describe("返回数量限制（默认10，最大50）"),
        type: z.enum(["concept", "decision", "todo", "note", "project"]).optional().describe("筛选类型"),
        days: z.number().optional().describe("只返回最近N天内更新的知识点（默认不限）"),
        sort_by: z.enum(["updated", "created"]).optional().describe("排序字段（默认 updated）"),
      }),
    },
    async (params) => {
      try {
        const limit = Math.min(params.limit || 10, 50);
        const days = params.days;
        const sortBy = params.sort_by || "updated";

        // Read index directly — much faster than searchKnowledge for listing
        let candidates = await loadAllEntries();

        // Filter by type
        if (params.type) {
          candidates = candidates.filter(kp => kp.type === params.type);
        }

        // Filter by date if specified
        if (days) {
          const cutoff = new Date();
          cutoff.setDate(cutoff.getDate() - days);
          const cutoffStr = cutoff.toISOString();
          candidates = candidates.filter(kp => kp[sortBy] >= cutoffStr);
        }

        // Sort by chosen field (most recent first)
        candidates.sort((a, b) => b[sortBy].localeCompare(a[sortBy]));

        // Apply limit
        const limited = candidates.slice(0, limit);

        if (limited.length === 0) {
          return {
            content: [{ type: "text" as const, text: "没有找到最近的知识点。" }],
          };
        }

        const text = limited
          .map((kp, i) => {
            const date = kp[sortBy].split("T")[0];
            const time = kp[sortBy].split("T")[1]?.slice(0, 5) || "";
            return `${i + 1}. [${kp.type}] **${kp.title}** (${date} ${time})\n   ${kp.content.slice(0, 100)}${kp.content.length > 100 ? "..." : ""}`;
          })
          .join("\n\n");

        const total = candidates.length;
        return {
          content: [{
            type: "text" as const,
            text: `📋 最近 ${limited.length} 个知识点${days ? `（${days}天内）` : ""}${params.type ? ` [${params.type}]` : ""}（共 ${total} 个）\n\n${text}`,
          }],
        };
      } catch (error) {
        return {
          content: [{
            type: "text" as const,
            text: `获取最近知识点失败: ${error instanceof Error ? error.message : String(error)}`,
          }],
          isError: true,
        };
      }
    }
  );
}

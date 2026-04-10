/**
 * knowledge_search MCP Tool
 */

import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { searchKnowledge, type KnowledgeType } from "../core.js";

export function registerSearchTool(server: McpServer): void {
  server.registerTool(
    "knowledge_search",
    {
      title: "搜索知识",
      description: "在知识库中搜索知识点",
      inputSchema: z.object({
        query: z.string().describe("搜索关键词"),
        type: z.enum(["concept", "decision", "todo", "note", "project"]).optional().describe("筛选类型"),
        tags: z.array(z.string()).optional().describe("筛选标签"),
        limit: z.number().optional().describe("返回数量限制"),
      }),
    },
    async (params) => {
      try {
        const results = await searchKnowledge({
          query: params.query,
          type: params.type as KnowledgeType | undefined,
          tags: params.tags,
          limit: params.limit,
        });

        if (results.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `🔍 搜索: "${params.query}"\n\n未找到匹配的知识点`,
              },
            ],
          };
        }

        const resultText = results
          .map(
            (kp, i) =>
              `${i + 1}. **${kp.title}** (${kp.type})\n   ID: ${kp.id}\n   ${kp.content.slice(0, 100)}${kp.content.length > 100 ? "..." : ""}\n   标签: ${kp.tags.join(", ") || "无"}`
          )
          .join("\n\n");

        return {
          content: [
            {
              type: "text",
              text: `🔍 找到 ${results.length} 条知识点\n\n${resultText}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `❌ 搜索失败: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    }
  );
}
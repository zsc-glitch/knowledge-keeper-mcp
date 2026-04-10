/**
 * knowledge_bm25_search MCP Tool
 * BM25 关键词检索
 */

import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { bm25Search } from "../core.js";

export function registerBM25SearchTool(server: McpServer): void {
  server.registerTool(
    "knowledge_bm25_search",
    {
      title: "BM25 搜索",
      description: "使用 BM25 算法进行关键词检索（对标 memory-lancedb-pro）",
      inputSchema: z.object({
        query: z.string().describe("搜索关键词"),
        topK: z.number().optional().describe("返回数量（默认10）"),
      }),
    },
    async (params) => {
      try {
        const results = await bm25Search({
          query: params.query,
          topK: params.topK,
        });

        if (results.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `🔍 BM25 搜索: "${params.query}"\n\n未找到匹配的知识点`,
              },
            ],
          };
        }

        const resultText = results
          .map(
            (kp, i) =>
              `${i + 1}. **${kp.title}** (${kp.type}) [BM25: ${kp.score.toFixed(2)}]\n   ID: ${kp.id}\n   ${kp.content.slice(0, 100)}${kp.content.length > 100 ? "..." : ""}\n   标签: ${kp.tags.join(", ") || "无"}`
          )
          .join("\n\n");

        return {
          content: [
            {
              type: "text",
              text: `🔍 BM25 找到 ${results.length} 条知识点\n\n${resultText}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `❌ BM25 搜索失败: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    }
  );
}
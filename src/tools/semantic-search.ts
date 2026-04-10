/**
 * knowledge_semantic_search MCP Tool
 */

import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { semanticSearch } from "../core.js";

export function registerSemanticSearchTool(server: McpServer): void {
  server.registerTool(
    "knowledge_semantic_search",
    {
      title: "语义搜索",
      description: "使用语义理解搜索知识库，比关键词搜索更智能",
      inputSchema: z.object({
        query: z.string().describe("搜索内容（自然语言）"),
        topK: z.number().optional().describe("返回数量（默认10）"),
        threshold: z.number().optional().describe("相似度阈值（0-1，默认0.3）"),
      }),
    },
    async (params) => {
      try {
        const results = await semanticSearch({
          query: params.query,
          topK: params.topK,
          threshold: params.threshold,
        });

        if (results.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `🔍 语义搜索: "${params.query}"\n\n未找到语义相关的知识点`,
              },
            ],
          };
        }

        const resultText = results
          .map(
            (kp, i) =>
              `${i + 1}. **${kp.title}** (${kp.type}) [相似度: ${(kp.similarity * 100).toFixed(1)}%]\n   ID: ${kp.id}\n   ${kp.content.slice(0, 100)}${kp.content.length > 100 ? "..." : ""}\n   标签: ${kp.tags.join(", ") || "无"}`
          )
          .join("\n\n");

        return {
          content: [
            {
              type: "text",
              text: `🔍 语义搜索找到 ${results.length} 条相关知识点\n\n${resultText}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `❌ 语义搜索失败: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    }
  );
}
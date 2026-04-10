/**
 * knowledge_save MCP Tool
 */

import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { saveKnowledge, type KnowledgeType } from "../core.js";

export function registerSaveTool(server: McpServer): void {
  server.registerTool(
    "knowledge_save",
    {
      title: "保存知识点",
      description: "保存一条新的知识到知识库",
      inputSchema: z.object({
        type: z.enum(["concept", "decision", "todo", "note", "project"]).describe("知识类型"),
        title: z.string().describe("标题"),
        content: z.string().describe("内容"),
        tags: z.array(z.string()).optional().describe("标签列表"),
      }),
    },
    async (params) => {
      try {
        const kp = await saveKnowledge({
          type: params.type as KnowledgeType,
          title: params.title,
          content: params.content,
          tags: params.tags,
        });

        return {
          content: [
            {
              type: "text",
              text: `✅ 知识已保存\n\n📝 **${kp.title}**\n类型: ${kp.type}\nID: ${kp.id}\n标签: ${kp.tags.join(", ") || "无"}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `❌ 保存失败: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    }
  );
}
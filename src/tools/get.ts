/**
 * knowledge_get MCP Tool
 */

import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { getKnowledge } from "../core.js";

export function registerGetTool(server: McpServer): void {
  server.registerTool(
    "knowledge_get",
    {
      title: "获取知识点",
      description: "根据 ID 获取单个知识点",
      inputSchema: z.object({
        id: z.string().describe("知识点 ID"),
      }),
    },
    async (params) => {
      try {
        const kp = await getKnowledge(params.id);

        if (!kp) {
          return {
            content: [
              {
                type: "text",
                text: `❌ 未找到知识点: ${params.id}`,
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: `📝 **${kp.title}**\n\n类型: ${kp.type}\nID: ${kp.id}\n创建: ${new Date(kp.created).toLocaleString("zh-CN")}\n标签: ${kp.tags.join(", ") || "无"}\n\n---\n\n${kp.content}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `❌ 获取失败: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    }
  );
}
/**
 * knowledge_tags MCP Tool
 */

import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { listTags } from "../core.js";

export function registerTagsTool(server: McpServer): void {
  server.registerTool(
    "knowledge_tags",
    {
      title: "列出标签",
      description: "列出知识库中的所有标签",
      inputSchema: z.object({}),
    },
    async () => {
      try {
        const tags = await listTags();
        const entries = Object.entries(tags).sort((a, b) => b[1] - a[1]);

        if (entries.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: "🏷️ 知识库标签\n\n暂无标签",
              },
            ],
          };
        }

        const tagsText = entries.map(([tag, count]) => `- **${tag}** (${count} 条)`).join("\n");

        return {
          content: [
            {
              type: "text",
              text: `🏷️ 知识库标签 (${entries.length} 个)\n\n${tagsText}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `❌ 获取标签失败: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    }
  );
}
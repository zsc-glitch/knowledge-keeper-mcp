/**
 * knowledge_get_linked - 查询知识关联
 */

import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { getKnowledge, getLinks } from "../core.js";

export function registerGetLinkedTool(server: McpServer): void {
  server.registerTool(
    "knowledge_get_linked",
    {
      title: "查询知识关联",
      description: "查询知识点关联的所有其他知识点",
      inputSchema: z.object({
        id: z.string().describe("知识点ID"),
        relation: z.string().optional().describe("关联类型筛选（可选）"),
        direction: z.enum(["outgoing", "incoming", "both"]).default("both").describe("关联方向"),
      }),
    },
    async (params) => {
      const { id, relation, direction } = params;

      try {
        const kp = await getKnowledge(id);
        if (!kp) {
          return {
            content: [{
              type: "text",
              text: `❌ 知识点不存在: ${id}`,
            }],
          };
        }

        const links = await getLinks(id, relation, direction);

        if (links.length === 0) {
          return {
            content: [{
              type: "text",
              text: `📭 **${kp.title}** 没有关联的知识点`,
            }],
          };
        }

        // 格式化输出
        let output = `🔗 **${kp.title}** 的关联知识点\n\n`;

        const grouped: Record<string, Array<{ id: string; title: string; direction: string }>> = {};

        for (const link of links) {
          const rel = link.relation;
          if (!grouped[rel]) {
            grouped[rel] = [];
          }
          grouped[rel].push(link);
        }

        for (const [rel, items] of Object.entries(grouped)) {
          output += `**${rel}**:\n`;
          for (const item of items) {
            const arrow = item.direction === "outgoing" ? "→" : "←";
            output += `  ${arrow} ${item.title} (${item.id})\n`;
          }
          output += "\n";
        }

        output += `\n总计: ${links.length} 个关联`;

        return {
          content: [{
            type: "text",
            text: output,
          }],
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `❌ 查询关联失败: ${error instanceof Error ? error.message : String(error)}`,
          }],
        };
      }
    }
  );
}
/**
 * knowledge_graph_visualize MCP Tool
 * 导出可视化图谱
 */

import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { exportMermaid, getGraphStats } from "../graph.js";

export function registerGraphVisualizeTool(server: McpServer): void {
  server.registerTool(
    "knowledge_graph_visualize",
    {
      title: "可视化知识图谱",
      description: "导出知识图谱为可视化格式（Mermaid/GraphViz）",
      inputSchema: z.object({
        format: z.enum(["mermaid", "json"]).default("mermaid").describe("导出格式"),
        entityIds: z.array(z.string()).optional().describe("指定实体范围"),
        maxDepth: z.number().optional().describe("最大深度"),
      }),
    },
    async (params) => {
      try {
        const { format, entityIds, maxDepth } = params;

        if (format === "json") {
          // 导出 JSON
          const stats = await getGraphStats();
          // TODO: load full graph for JSON export

          return {
            content: [
              {
                type: "text",
                text: `📊 **图谱统计**\n\n实体: ${stats.entityCount}\n关系: ${stats.relationCount}\n\n实体类型分布:\n${Object.entries(stats.entityTypeCounts)
                  .map(([type, count]) => `- ${type}: ${count}`)
                  .join("\n")}`,
              },
            ],
          };
        }

        // 导出 Mermaid
        const mermaid = await exportMermaid(entityIds, maxDepth);

        return {
          content: [
            {
              type: "text",
              text: `🎨 **Mermaid 图谱**\n\n\`\`\`mermaid\n${mermaid}\n\`\`\`\n\n可在 Mermaid Live Editor 查看: https://mermaid.live`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `❌ 导出失败: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    }
  );
}
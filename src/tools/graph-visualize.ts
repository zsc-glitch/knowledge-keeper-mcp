/**
 * knowledge_graph_visualize MCP Tool
 * 导出可视化图谱
 */

import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { exportMermaid, getGraphStats, loadGraph } from "../graph.js";

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
          // Export full graph as JSON
          const graph = await loadGraph();
          const stats = await getGraphStats();

          const exportData = {
            entities: graph.entities.map(e => ({
              id: e.id,
              name: e.name,
              type: e.type,
              aliases: e.aliases,
              sourceIds: e.sourceIds,
            })),
            relations: graph.relations.map(r => ({
              id: r.id,
              sourceId: r.sourceId,
              targetId: r.targetId,
              type: r.type,
              weight: r.weight,
            })),
            stats,
          };

          return {
            content: [
              {
                type: "text",
                text: `📊 **知识图谱 JSON**\n\n\`\`\`json\n${JSON.stringify(exportData, null, 2)}\n\`\`\``,
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
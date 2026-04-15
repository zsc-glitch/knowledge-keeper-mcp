/**
 * knowledge_graph - 知识图谱可视化
 * 
 * 返回知识点及其关联的图谱结构
 * 可用于前端可视化展示
 */

import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { getKnowledge, getLinks, listTags } from "../core.js";

const GraphSchema = z.object({
  root: z.string().optional().describe("根节点知识点ID（可选，不填则返回全部图谱）"),
  depth: z.number().min(1).max(5).default(2).describe("图谱深度"),
  minLinks: z.number().min(0).default(1).describe("最小关联数（过滤孤立节点）"),
});

export function registerGraphTool(server: McpServer): void {
  server.registerTool(
    "knowledge_graph",
    {
      title: "知识图谱可视化",
      description: "返回知识点及其关联的图谱结构，用于可视化展示",
      inputSchema: GraphSchema,
    },
    async (params) => {
      const { root, depth, minLinks } = params;

      try {
        const nodes: Array<{
          id: string;
          title: string;
          type: string;
          tags: string[];
          linksCount: number;
        }> = [];
        const edges: Array<{
          from: string;
          to: string;
          relation: string;
        }> = [];

        if (root) {
          // 从根节点开始构建图谱
          await buildGraphFromRoot(root, depth, nodes, edges, new Set());
        } else {
          // 构建全局图谱
          await buildFullGraph(nodes, edges, minLinks);
        }

        // 计算统计信息
        const stats = {
          nodes: nodes.length,
          edges: edges.length,
          avgLinks: nodes.length > 0
            ? Math.round(nodes.reduce((sum, n) => sum + n.linksCount, 0) / nodes.length)
            : 0,
          isolatedNodes: nodes.filter(n => n.linksCount === 0).length,
        };

        // 格式化输出
        let output = `📊 **知识图谱**\n\n`;
        output += `节点: ${stats.nodes} | 关联: ${stats.edges} | 平均关联: ${stats.avgLinks}\n\n`;

        if (nodes.length === 0) {
          output += `📭 知识库中没有满足条件的知识点`;
        } else {
          // 输出节点列表（按关联数排序）
          output += `**核心节点**（关联数 ≥ 3）:\n`;
          const coreNodes = nodes.filter(n => n.linksCount >= 3);
          for (const node of coreNodes.slice(0, 10)) {
            output += `- ${node.title} (${node.linksCount} 关联)\n`;
          }

          output += `\n**图谱结构**:\n`;
          output += `{\n`;
          output += `  "nodes": ${JSON.stringify(nodes.slice(0, 20))},\n`;
          output += `  "edges": ${JSON.stringify(edges.slice(0, 30))},\n`;
          output += `  "stats": ${JSON.stringify(stats)}\n`;
          output += `}\n`;
        }

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
            text: `❌ 图谱构建失败: ${error instanceof Error ? error.message : String(error)}`,
          }],
        };
      }
    }
  );
}

/**
 * 从根节点递归构建图谱
 */
async function buildGraphFromRoot(
  rootId: string,
  depth: number,
  nodes: Array<{ id: string; title: string; type: string; tags: string[]; linksCount: number }>,
  edges: Array<{ from: string; to: string; relation: string }>,
  visited: Set<string>,
  currentDepth: number = 0
): Promise<void> {
  if (currentDepth >= depth || visited.has(rootId)) return;
  visited.add(rootId);

  const kp = await getKnowledge(rootId);
  if (!kp) return;

  const links = await getLinks(rootId);

  nodes.push({
    id: kp.id,
    title: kp.title,
    type: kp.type,
    tags: kp.tags,
    linksCount: links.length,
  });

  for (const link of links) {
    edges.push({
      from: link.direction === "outgoing" ? rootId : link.id,
      to: link.direction === "outgoing" ? link.id : rootId,
      relation: link.relation,
    });

    // 递归处理关联节点
    await buildGraphFromRoot(link.id, depth, nodes, edges, visited, currentDepth + 1);
  }
}

/**
 * 构建全局图谱
 */
async function buildFullGraph(
  nodes: Array<{ id: string; title: string; type: string; tags: string[]; linksCount: number }>,
  edges: Array<{ from: string; to: string; relation: string }>,
  minLinks: number
): Promise<void> {
  // 需要从索引获取所有知识点
  // 这里简化处理，先获取标签相关的知识点
  const tags = await listTags();
  const tagIds = Object.keys(tags).slice(0, 10); // 限制标签数量

  for (const tag of tagIds) {
    // 通过标签搜索知识点
    // 实际实现需要调用 searchKnowledge
  }

  // 获取所有关联
  for (const node of nodes) {
    const links = await getLinks(node.id);
    node.linksCount = links.length;

    for (const link of links) {
      edges.push({
        from: link.direction === "outgoing" ? node.id : link.id,
        to: link.direction === "outgoing" ? link.id : node.id,
        relation: link.relation,
      });
    }
  }

  // 过滤孤立节点
  if (minLinks > 0) {
    const filteredNodes = nodes.filter(n => n.linksCount >= minLinks);
    nodes.length = 0;
    nodes.push(...filteredNodes);
  }
}
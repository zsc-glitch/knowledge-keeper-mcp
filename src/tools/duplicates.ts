/**
 * knowledge_duplicates MCP Tool
 * Detect duplicate or similar knowledge points
 */

import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { loadAllEntries, tokenizeForSimilarity, type KnowledgePoint } from "../core.js";

export function registerDuplicatesTool(server: McpServer): void {
  server.registerTool(
    "knowledge_duplicates",
    {
      title: "重复检测",
      description: "检测知识库中标题或内容相似的知识点，帮助清理重复内容。返回相似组及合并建议。",
      inputSchema: z.object({
        threshold: z.number().min(0.1).max(1.0).default(0.7).describe("相似度阈值（默认0.7，越高越严格）"),
        scope: z.enum(["title", "content", "both"]).default("both").describe("检测范围"),
        limit: z.number().min(1).max(50).default(10).describe("最大返回组数"),
      }),
    },
    async (params) => {
      try {
        const threshold = params.threshold || 0.7;
        const scope = params.scope || "both";
        const limit = params.limit || 10;

        const allEntries = await loadAllEntries();

        if (allEntries.length < 2) {
          return {
            content: [{
              type: "text" as const,
              text: "📋 知识点不足2个，无法检测重复。",
            }],
          };
        }

        // Find duplicate groups
        const visited = new Set<string>();
        const groups: Array<{
          similarity: number;
          items: Array<{ id: string; title: string; type: string; created: string }>;
          suggestion: string;
        }> = [];

        for (let i = 0; i < allEntries.length && groups.length < limit; i++) {
          if (visited.has(allEntries[i].id)) continue;

          const group: KnowledgePoint[] = [allEntries[i]];

          for (let j = i + 1; j < allEntries.length; j++) {
            if (visited.has(allEntries[j].id)) continue;

            const sim = computeSimilarity(allEntries[i], allEntries[j], scope);
            if (sim >= threshold) {
              group.push(allEntries[j]);
              visited.add(allEntries[j].id);
            }
          }

          if (group.length > 1) {
            visited.add(allEntries[i].id);

            // Determine best suggestion
            const newest = group.reduce((a, b) => a.updated > b.updated ? a : b);
            const longest = group.reduce((a, b) => a.content.length > b.content.length ? a : b);
            const hasMostTags = group.reduce((a, b) => a.tags.length > b.tags.length ? a : b);

            let suggestion: string;
            if (group.length === 2) {
              suggestion = `建议保留 "${newest.title}" (${newest.id.slice(0, 15)}...)，合并另一个`;
            } else {
              suggestion = `建议保留 "${hasMostTags.title}" (${hasMostTags.id.slice(0, 15)}...)，合并其余 ${group.length - 1} 个`;
            }

            // Use the highest pairwise similarity as the group's similarity
            const maxSim = group.slice(1).reduce(
              (max, kp) => Math.max(max, computeSimilarity(group[0], kp, scope)),
              0
            );

            groups.push({
              similarity: Math.round(maxSim * 100) / 100,
              items: group.map(kp => ({
                id: kp.id,
                title: kp.title,
                type: kp.type,
                created: kp.created.split("T")[0],
              })),
              suggestion,
            });
          }
        }

        // Sort by similarity descending
        groups.sort((a, b) => b.similarity - a.similarity);

        if (groups.length === 0) {
          return {
            content: [{
              type: "text" as const,
              text: `✅ 未发现重复知识点（阈值: ${threshold}，范围: ${scope}）`,
            }],
          };
        }

        const text = groups
          .map((g, i) => {
            const itemsText = g.items
              .map(item => `    - [${item.type}] ${item.title} (${item.created})`)
              .join("\n");
            return `${i + 1}. 🔗 相似度 ${g.similarity}（${g.items.length} 个）\n${itemsText}\n    💡 ${g.suggestion}`;
          })
          .join("\n\n");

        return {
          content: [{
            type: "text" as const,
            text: `🔍 **重复检测**（阈值: ${threshold}，范围: ${scope}）\n\n发现 ${groups.length} 组相似知识点（共 ${allEntries.length} 个知识点中）\n\n${text}\n\n💡 使用 knowledge_merge 工具合并重复项`,
          }],
        };
      } catch (error) {
        return {
          content: [{
            type: "text" as const,
            text: `❌ 重复检测失败: ${error instanceof Error ? error.message : String(error)}`,
          }],
          isError: true,
        };
      }
    }
  );
}

/**
 * Compute similarity between two knowledge points
 */
function computeSimilarity(a: KnowledgePoint, b: KnowledgePoint, scope: "title" | "content" | "both"): number {
  let titleSim = 0;
  let contentSim = 0;

  if (scope === "title" || scope === "both") {
    titleSim = jaccardSimilarity(a.title, b.title);
  }

  if (scope === "content" || scope === "both") {
    contentSim = jaccardSimilarity(a.content, b.content);
  }

  if (scope === "title") return titleSim;
  if (scope === "content") return contentSim;

  // "both": weighted average, title has higher weight
  return titleSim * 0.6 + contentSim * 0.4;
}

/**
 * Jaccard similarity using shared tokenizeForSimilarity (Chinese + English)
 */
function jaccardSimilarity(a: string, b: string): number {
  const wordsA = tokenizeForSimilarity(a, 1);
  const wordsB = tokenizeForSimilarity(b, 1);

  if (wordsA.size === 0 && wordsB.size === 0) return 1;
  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let intersection = 0;
  for (const word of wordsA) {
    if (wordsB.has(word)) intersection++;
  }

  const union = wordsA.size + wordsB.size - intersection;
  return union > 0 ? intersection / union : 0;
}

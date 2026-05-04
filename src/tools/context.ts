/**
 * knowledge_context MCP Tool
 * Gather contextual knowledge neighborhood for a given knowledge point.
 * Traverses links, shared tags, and similar titles to build rich context.
 */

import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { getKnowledge, loadAllEntries, type KnowledgePoint } from "../core.js";

export function registerContextTool(server: McpServer): void {
  server.registerTool(
    "knowledge_context",
    {
      title: "知识上下文",
      description: "获取某个知识点的完整上下文：包括自身、关联链接、共享标签、标题相似的知识点。帮助AI Agent快速构建领域上下文。",
      inputSchema: z.object({
        id: z.string().describe("目标知识点ID"),
        depth: z.enum(["quick", "standard", "deep"]).default("standard").describe("探索深度: quick=仅链接, standard=+同标签, deep=+标题相似"),
        max_results: z.number().min(3).max(30).default(10).describe("最大返回关联知识点数量"),
      }),
    },
    async (params) => {
      try {
        const depth = params.depth || "standard";
        const maxResults = params.max_results || 10;

        // 1. Load the target knowledge point
        const target = await getKnowledge(params.id);
        if (!target) {
          return {
            content: [{
              type: "text" as const,
              text: `❌ 未找到知识点: ${params.id}`,
            }],
            isError: true,
          };
        }

        const allEntries = await loadAllEntries();
        const seen = new Set<string>([target.id]);
        const related: Array<{ kp: KnowledgePoint; reason: string; score: number }> = [];

        // 2. Direct links (always included)
        for (const linkId of target.links || []) {
          if (seen.has(linkId)) continue;
          const linked = await getKnowledge(linkId);
          if (linked) {
            seen.add(linked.id);
            related.push({ kp: linked, reason: "直接链接", score: 1.0 });
          }
        }

        // 3. Items linking TO this one (reverse links)
        for (const entry of allEntries) {
          if (seen.has(entry.id)) continue;
          if (entry.links && entry.links.includes(target.id)) {
            seen.add(entry.id);
            related.push({ kp: entry, reason: "反向链接", score: 0.9 });
          }
        }

        // 4. Shared tags (standard & deep)
        if (depth === "standard" || depth === "deep") {
          const targetTags = new Set(target.tags.map(t => t.toLowerCase()));
          for (const entry of allEntries) {
            if (seen.has(entry.id)) continue;
            const sharedTags = entry.tags.filter(t => targetTags.has(t.toLowerCase()));
            if (sharedTags.length > 0) {
              seen.add(entry.id);
              const overlapRatio = sharedTags.length / Math.max(target.tags.length, 1);
              related.push({
                kp: entry,
                reason: `共享标签: ${sharedTags.join(", ")}`,
                score: 0.5 + overlapRatio * 0.3,
              });
            }
          }
        }

        // 5. Similar titles (deep only)
        if (depth === "deep") {
          const targetWords = new Set(target.title.toLowerCase().split(/\s+/).filter(w => w.length > 2));
          for (const entry of allEntries) {
            if (seen.has(entry.id)) continue;
            const entryWords = new Set(entry.title.toLowerCase().split(/\s+/).filter(w => w.length > 2));
            let intersection = 0;
            for (const w of targetWords) { if (entryWords.has(w)) intersection++; }
            const union = targetWords.size + entryWords.size - intersection;
            const sim = union > 0 ? intersection / union : 0;
            if (sim >= 0.4) {
              seen.add(entry.id);
              related.push({
                kp: entry,
                reason: `标题相似 ${Math.round(sim * 100)}%`,
                score: 0.3 + sim * 0.3,
              });
            }
          }
        }

        // Sort by score descending, apply limit
        related.sort((a, b) => b.score - a.score);
        const limited = related.slice(0, maxResults);

        // Build output
        const targetBlock = `📌 **${target.title}** (${target.type})\n   ID: ${target.id}\n   标签: ${target.tags.join(", ") || "无"}\n   创建: ${target.created.split("T")[0]}\n   内容: ${target.content.slice(0, 200)}${target.content.length > 200 ? "..." : ""}`;

        if (limited.length === 0) {
          return {
            content: [{
              type: "text" as const,
              text: `🔍 **知识上下文** [${depth}]\n\n${targetBlock}\n\n📭 没有发现关联知识点。`,
            }],
          };
        }

        const relatedBlock = limited
          .map((r, i) => {
            const date = r.kp.created.split("T")[0];
            return `${i + 1}. [${r.kp.type}] **${r.kp.title}** (${date})\n   原因: ${r.reason} | 相关度: ${Math.round(r.score * 100)}%\n   ${r.kp.content.slice(0, 120)}${r.kp.content.length > 120 ? "..." : ""}`;
          })
          .join("\n\n");

        // Summary stats
        const reasons = new Map<string, number>();
        for (const r of limited) {
          const key = r.reason.split(":")[0]; // "直接链接", "反向链接", "共享标签", "标题相似"
          reasons.set(key, (reasons.get(key) || 0) + 1);
        }
        const statsText = [...reasons.entries()]
          .map(([k, v]) => `${k}: ${v}`)
          .join(" | ");

        return {
          content: [{
            type: "text" as const,
            text: `🔍 **知识上下文** [${depth}]\n\n${targetBlock}\n\n---\n\n📎 **关联知识点** (${limited.length} 个):\n\n${relatedBlock}\n\n📊 ${statsText}`,
          }],
        };
      } catch (error) {
        return {
          content: [{
            type: "text" as const,
            text: `❌ 获取知识上下文失败: ${error instanceof Error ? error.message : String(error)}`,
          }],
          isError: true,
        };
      }
    }
  );
}

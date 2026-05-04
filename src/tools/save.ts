/**
 * knowledge_save MCP Tool
 */

import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { saveKnowledge, loadAllEntries, type KnowledgeType } from "../core.js";

export function registerSaveTool(server: McpServer): void {
  server.registerTool(
    "knowledge_save",
    {
      title: "保存知识点",
      description: "保存一条新的知识到知识库。自动检测标题相似的已有知识点并提示。",
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

        // Check for similar existing titles
        let duplicateWarning = "";
        try {
          const allEntries = await loadAllEntries();
          const titleWords = new Set(params.title.toLowerCase().split(/\s+/).filter(w => w.length > 2));
          const similar = allEntries
            .filter(e => e.id !== kp.id)
            .map(e => {
              const eWords = new Set(e.title.toLowerCase().split(/\s+/).filter(w => w.length > 2));
              let intersection = 0;
              for (const w of titleWords) { if (eWords.has(w)) intersection++; }
              const union = titleWords.size + eWords.size - intersection;
              const sim = union > 0 ? intersection / union : 0;
              return { entry: e, similarity: sim };
            })
            .filter(s => s.similarity >= 0.6)
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 3);

          if (similar.length > 0) {
            const items = similar.map(s =>
              `  - [${s.entry.type}] "${s.entry.title}" (${Math.round(s.similarity * 100)}% 相似)`
            ).join("\n");
            duplicateWarning = `\n\n⚠️ **检测到相似知识点**：\n${items}\n💡 使用 knowledge_duplicates 或 knowledge_merge 处理`;
          }
        } catch {
          // Duplicate check is best-effort, don't fail the save
        }

        return {
          content: [
            {
              type: "text",
              text: `✅ 知识已保存\n\n📝 **${kp.title}**\n类型: ${kp.type}\nID: ${kp.id}\n标签: ${kp.tags.join(", ") || "无"}${duplicateWarning}`,
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
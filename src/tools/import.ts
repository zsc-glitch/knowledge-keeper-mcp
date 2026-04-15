/**
 * knowledge_import - 导入知识
 * 
 * 支持从多种格式导入：
 * - JSON（批量导入）
 * - Markdown（Obsidian格式）
 */

import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { saveKnowledge, type KnowledgeType } from "../core.js";

const ImportSchema = z.object({
  format: z.enum(["json", "markdown"]).default("json").describe("导入格式"),
  content: z.string().describe("导入内容"),
  overwrite: z.boolean().default(false).describe("是否覆盖已存在的知识点"),
});

export function registerImportTool(server: McpServer): void {
  server.registerTool(
    "knowledge_import",
    {
      title: "导入知识",
      description: "从JSON或Markdown格式批量导入知识点",
      inputSchema: ImportSchema,
    },
    async (params) => {
      const { format, content, overwrite } = params;

      try {
        let imported: Array<{ id: string; title: string; type: string }> = [];
        let skipped = 0;
        let errors = 0;

        if (format === "json") {
          const result = await importFromJSON(content, overwrite);
          imported = result.imported;
          skipped = result.skipped;
          errors = result.errors;
        } else if (format === "markdown") {
          const result = await importFromMarkdown(content, overwrite);
          imported = result.imported;
          skipped = result.skipped;
          errors = result.errors;
        }

        // 格式化输出
        let output = `✅ **导入完成**\n\n`;
        output += `成功: ${imported.length} 条\n`;
        output += `跳过: ${skipped} 条\n`;
        output += `错误: ${errors} 条\n\n`;

        if (imported.length > 0) {
          output += `**已导入知识点**:\n`;
          for (const kp of imported.slice(0, 10)) {
            output += `- ${kp.title} (${kp.type})\n`;
          }
          if (imported.length > 10) {
            output += `... 还有 ${imported.length - 10} 条\n`;
          }
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
            text: `❌ 导入失败: ${error instanceof Error ? error.message : String(error)}`,
          }],
        };
      }
    }
  );
}

/**
 * 从 JSON 导入
 */
async function importFromJSON(
  content: string,
  overwrite: boolean
): Promise<{ imported: Array<{ id: string; title: string; type: string }>; skipped: number; errors: number }> {
  const imported: Array<{ id: string; title: string; type: string }> = [];
  let skipped = 0;
  let errors = 0;

  try {
    const data = JSON.parse(content);
    const knowledgeArray = data.knowledge || data.items || data || [];

    for (const item of knowledgeArray) {
      try {
        // 验证必要字段
        if (!item.title || !item.content) {
          errors++;
          continue;
        }

        const type = validateType(item.type) || "note";
        const kp = await saveKnowledge({
          type,
          title: item.title,
          content: item.content,
          tags: item.tags || [],
          links: item.links || [],
        });

        imported.push({
          id: kp.id,
          title: kp.title,
          type: kp.type,
        });
      } catch (err) {
        errors++;
      }
    }
  } catch (err) {
    errors++;
  }

  return { imported, skipped, errors };
}

/**
 * 从 Markdown 导入
 */
async function importFromMarkdown(
  content: string,
  overwrite: boolean
): Promise<{ imported: Array<{ id: string; title: string; type: string }>; skipped: number; errors: number }> {
  const imported: Array<{ id: string; title: string; type: string }> = [];
  let skipped = 0;
  let errors = 0;

  // 按标题分割知识点
  const sections = content.split(/^## /m).filter(s => s.trim());

  for (const section of sections) {
    try {
      // 解析标题
      const titleMatch = section.match(/^([^\n]+)/);
      if (!titleMatch) {
        errors++;
        continue;
      }

      const title = titleMatch[1].trim();

      // 解析内容（移除元数据）
      const lines = section.split("\n").slice(1);
      let contentLines: string[] = [];
      let type: KnowledgeType = "note";
      let tags: string[] = [];

      for (const line of lines) {
        // 解析元数据
        if (line.startsWith("**ID**:")) continue;
        if (line.startsWith("**类型**:")) {
          const typeMatch = line.match(/\*\*类型\*\*:\s*(\w+)/);
          if (typeMatch) {
            type = validateType(typeMatch[1]) || "note";
          }
          continue;
        }
        if (line.startsWith("**标签**:")) {
          const tagsMatch = line.match(/\*\*标签\*\*:\s*(.+)/);
          if (tagsMatch) {
            tags = tagsMatch[1].split(",").map(t => t.trim()).filter(t => t !== "无");
          }
          continue;
        }
        if (line.startsWith("**创建**:")) continue;
        if (line.startsWith("**更新**:")) continue;
        if (line.startsWith("---")) continue;

        contentLines.push(line);
      }

      const kpContent = contentLines.join("\n").trim();
      if (!kpContent) {
        skipped++;
        continue;
      }

      const kp = await saveKnowledge({
        type,
        title,
        content: kpContent,
        tags,
      });

      imported.push({
        id: kp.id,
        title: kp.title,
        type: kp.type,
      });
    } catch (err) {
      errors++;
    }
  }

  return { imported, skipped, errors };
}

/**
 * 验证知识类型
 */
function validateType(type: string): KnowledgeType | null {
  const validTypes: KnowledgeType[] = ["concept", "decision", "todo", "note", "project"];
  const lowerType = type.toLowerCase();
  
  if (validTypes.includes(lowerType as KnowledgeType)) {
    return lowerType as KnowledgeType;
  }
  
  // 尝试映射常见别名
  const aliases: Record<string, KnowledgeType> = {
    "概念": "concept",
    "决定": "decision",
    "待办": "todo",
    "笔记": "note",
    "项目": "project",
    "decision": "decision",
    "todo": "todo",
    "note": "note",
    "project": "project",
    "concept": "concept",
  };
  
  return aliases[lowerType] || null;
}
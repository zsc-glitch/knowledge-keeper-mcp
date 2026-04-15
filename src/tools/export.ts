/**
 * knowledge_export - 导出知识库
 * 
 * 支持多种格式导出：
 * - JSON（完整数据）
 * - Markdown（Obsidian格式）
 * - CSV（表格格式）
 */

import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import { getKnowledge, searchKnowledge, listTags, type KnowledgeType } from "../core.js";

const ExportSchema = z.object({
  format: z.enum(["json", "markdown", "csv"]).default("json").describe("导出格式"),
  type: z.enum(["concept", "decision", "todo", "note", "project"]).optional().describe("知识类型筛选"),
  tags: z.array(z.string()).optional().describe("标签筛选"),
  limit: z.number().min(1).max(1000).default(100).describe("导出数量限制"),
});

export function registerExportTool(server: McpServer): void {
  server.registerTool(
    "knowledge_export",
    {
      title: "导出知识库",
      description: "将知识库导出为JSON/Markdown/CSV格式",
      inputSchema: ExportSchema,
    },
    async (params) => {
      const { format, type, tags, limit } = params;

      try {
        // 搜索知识点
        const results = await searchKnowledge({
          query: "",
          type: type,
          tags: tags,
          limit: limit,
        });

        if (results.length === 0) {
          return {
            content: [{
              type: "text",
              text: `📭 没有找到符合条件的知识点`,
            }],
          };
        }

        // 根据格式导出
        let exportContent: string;
        let filename: string;
        let mimeType: string;

        switch (format) {
          case "json":
            exportContent = formatAsJSON(results);
            filename = `knowledge-export-${Date.now()}.json`;
            mimeType = "application/json";
            break;

          case "markdown":
            exportContent = formatAsMarkdown(results);
            filename = `knowledge-export-${Date.now()}.md`;
            mimeType = "text/markdown";
            break;

          case "csv":
            exportContent = formatAsCSV(results);
            filename = `knowledge-export-${Date.now()}.csv`;
            mimeType = "text/csv";
            break;
        }

        // 写入临时文件
        const tmpDir = path.join(os.tmpdir(), "knowledge-keeper");
        await fs.mkdir(tmpDir, { recursive: true });
        const filepath = path.join(tmpDir, filename);
        await fs.writeFile(filepath, exportContent, "utf-8");

        // 统计信息
        const stats = {
          total: results.length,
          types: countByType(results),
          tags: await listTags(),
        };

        let output = `✅ **导出成功**\n\n`;
        output += `格式: ${format}\n`;
        output += `数量: ${results.length} 条\n`;
        output += `文件: ${filename}\n\n`;

        output += `**类型分布**:\n`;
        for (const [t, count] of Object.entries(stats.types)) {
          output += `- ${t}: ${count}\n`;
        }

        output += `\n**导出路径**: ${filepath}`;

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
            text: `❌ 导出失败: ${error instanceof Error ? error.message : String(error)}`,
          }],
        };
      }
    }
  );
}

/**
 * JSON 格式
 */
function formatAsJSON(results: Array<{ id: string; title: string; content: string; type: KnowledgeType; tags: string[]; created: string; updated: string }>): string {
  return JSON.stringify({
    exportedAt: new Date().toISOString(),
    version: "0.9.0",
    count: results.length,
    knowledge: results,
  }, null, 2);
}

/**
 * Markdown 格式（Obsidian兼容）
 */
function formatAsMarkdown(results: Array<{ id: string; title: string; content: string; type: KnowledgeType; tags: string[]; created: string; updated: string }>): string {
  let md = `# 知识库导出\n\n`;
  md += `导出时间: ${new Date().toISOString()}\n`;
  md += `数量: ${results.length} 条\n\n`;
  md += `---\n\n`;

  for (const kp of results) {
    md += `## ${kp.title}\n\n`;
    md += `**ID**: ${kp.id}\n`;
    md += `**类型**: ${kp.type}\n`;
    md += `**标签**: ${kp.tags.join(", ") || "无"}\n`;
    md += `**创建**: ${kp.created}\n\n`;
    md += `${kp.content}\n\n`;
    md += `---\n\n`;
  }

  return md;
}

/**
 * CSV 格式
 */
function formatAsCSV(results: Array<{ id: string; title: string; content: string; type: KnowledgeType; tags: string[]; created: string; updated: string }>): string {
  const header = "id,type,title,content,tags,created,updated\n";
  const rows = results.map(kp => {
    const contentEscaped = kp.content.replace(/"/g, '""').slice(0, 200);
    const tagsJoined = kp.tags.join("|");
    return `"${kp.id}","${kp.type}","${kp.title}","${contentEscaped}","${tagsJoined}","${kp.created}","${kp.updated}"`;
  });

  return header + rows.join("\n");
}

/**
 * 统计各类型数量
 */
function countByType(results: Array<{ type: KnowledgeType }>): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const kp of results) {
    counts[kp.type] = (counts[kp.type] || 0) + 1;
  }
  return counts;
}
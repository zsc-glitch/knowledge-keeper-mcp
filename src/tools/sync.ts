/**
 * knowledge_sync - 知识同步
 * 
 * 支持与其他知识库同步：
 * - Git同步（远程仓库）
 * - Obsidian同步（vault路径）
 */

import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import * as fs from "fs/promises";
import * as path from "path";
import { saveKnowledge, searchKnowledge, listTags } from "../core.js";

const SyncSchema = z.object({
  action: z.enum(["status", "pull", "push", "diff"]).default("status").describe("同步操作"),
  source: z.string().optional().describe("同步源路径（Obsidian vault路径）"),
  auto: z.boolean().default(false).describe("是否自动同步"),
});

export function registerSyncTool(server: McpServer): void {
  server.registerTool(
    "knowledge_sync",
    {
      title: "知识同步",
      description: "与其他知识库（Obsidian vault）同步",
      inputSchema: SyncSchema,
    },
    async (params) => {
      const { action, source, auto } = params;

      try {
        switch (action) {
          case "status":
            return await getSyncStatus();

          case "pull":
            if (!source) {
              return {
                content: [{
                  type: "text" as const,
                  text: `❌ 请提供 source 参数（Obsidian vault路径）`,
                }],
              };
            }
            return await pullFromSource(source);

          case "push":
            if (!source) {
              return {
                content: [{
                  type: "text" as const,
                  text: `❌ 请提供 source 参数`,
                }],
              };
            }
            return await pushToSource(source);

          case "diff":
            if (!source) {
              return {
                content: [{
                  type: "text" as const,
                  text: `❌ 请提供 source 参数`,
                }],
              };
            }
            return await compareDiff(source);

          default:
            return {
              content: [{
                type: "text" as const,
                text: `❌ 未知操作: ${action}`,
              }],
            };
        }
      } catch (error) {
        return {
          content: [{
            type: "text" as const,
            text: `❌ 同步失败: ${error instanceof Error ? error.message : String(error)}`,
          }],
        };
      }
    }
  );
}

/**
 * 获取同步状态
 */
async function getSyncStatus() {
  const tags = await listTags();
  const allKP = await searchKnowledge({ query: "", limit: 100 });

  let output = `📊 **同步状态**\n\n`;
  output += `本地知识点: ${allKP.length}\n`;
  output += `标签数量: ${Object.keys(tags).length}\n\n`;

  // 检查 Obsidian vault 配置
  const vaultPath = process.env.OBSIDIAN_VAULT || "";
  if (vaultPath) {
    output += `Obsidian Vault: ${vaultPath}\n`;
    output += `同步状态: 已配置 ✅\n`;
  } else {
    output += `Obsidian Vault: 未配置\n`;
    output += `设置环境变量 OBSIDIAN_VAULT 启用同步\n`;
  }

  return {
    content: [{
      type: "text" as const,
      text: output,
    }],
  };
}

/**
 * 从源拉取
 */
async function pullFromSource(sourcePath: string) {
  let imported = 0;
  let skipped = 0;
  let errors = 0;

  try {
    // 检查源路径是否存在
    await fs.access(sourcePath);

    // 遍历所有文件夹
    const folders = ["概念", "决定", "待办", "笔记", "项目", "concept", "decision", "todo", "note", "project"];

    for (const folder of folders) {
      const folderPath = path.join(sourcePath, folder);
      try {
        const files = await fs.readdir(folderPath);
        for (const file of files) {
          if (!file.endsWith(".md")) continue;

          const filepath = path.join(folderPath, file);
          const content = await fs.readFile(filepath, "utf-8");

          // 解析 Obsidian 格式
          const parsed = parseObsidianMarkdown(content);
          if (parsed) {
            await saveKnowledge({
              type: parsed.type,
              title: parsed.title,
              content: parsed.content,
              tags: parsed.tags,
              links: parsed.links,
            });
            imported++;
          } else {
            skipped++;
          }
        }
      } catch {
        // 文件夹不存在，跳过
        continue;
      }
    }
  } catch (err) {
    errors++;
  }

  let output = `✅ **拉取完成**\n\n`;
  output += `导入: ${imported} 条\n`;
  output += `跳过: ${skipped} 条\n`;
  output += `错误: ${errors} 条\n`;
  output += `源路径: ${sourcePath}`;

  return {
    content: [{
      type: "text" as const,
      text: output,
    }],
  };
}

/**
 * 推送到源
 */
async function pushToSource(sourcePath: string) {
  const allKP = await searchKnowledge({ query: "", limit: 100 });
  let pushed = 0;
  let errors = 0;

  // 确保目录存在
  const folders = ["概念", "决定", "待办", "笔记", "项目"];
  for (const folder of folders) {
    await fs.mkdir(path.join(sourcePath, folder), { recursive: true });
  }

  for (const kp of allKP) {
    try {
      // 映射类型到文件夹
      const folderMap: Record<string, string> = {
        concept: "概念",
        decision: "决定",
        todo: "待办",
        note: "笔记",
        project: "项目",
      };
      const folder = folderMap[kp.type] || "笔记";
      const filename = `${kp.id}.md`;
      const filepath = path.join(sourcePath, folder, filename);

      // 格式化为 Obsidian 格式
      const obsidianContent = formatObsidianMarkdown(kp);
      await fs.writeFile(filepath, obsidianContent, "utf-8");
      pushed++;
    } catch {
      errors++;
    }
  }

  let output = `✅ **推送完成**\n\n`;
  output += `推送: ${pushed} 条\n`;
  output += `错误: ${errors} 条\n`;
  output += `目标路径: ${sourcePath}`;

  return {
    content: [{
      type: "text" as const,
      text: output,
    }],
  };
}

/**
 * 比较差异
 */
async function compareDiff(sourcePath: string) {
  const localKP = await searchKnowledge({ query: "", limit: 100 });
  const localIds = new Set(localKP.map(kp => kp.id));

  // 源端知识点（简化检测）
  let sourceCount = 0;
  try {
    const folders = ["概念", "决定", "待办", "笔记", "项目"];
    for (const folder of folders) {
      const folderPath = path.join(sourcePath, folder);
      try {
        const files = await fs.readdir(folderPath);
        sourceCount += files.filter(f => f.endsWith(".md")).length;
      } catch {
        continue;
      }
    }
  } catch {
    sourceCount = 0;
  }

  let output = `📊 **同步差异**\n\n`;
  output += `本地: ${localKP.length} 条\n`;
  output += `源端: ${sourceCount} 条\n`;
  output += `差异: ${Math.abs(localKP.length - sourceCount)} 条\n\n`;

  if (localKP.length > sourceCount) {
    output += `建议: push 推送本地到源端`;
  } else if (localKP.length < sourceCount) {
    output += `建议: pull 从源端拉取`;
  } else {
    output += `状态: 已同步 ✅`;
  }

  return {
    content: [{
      type: "text" as const,
      text: output,
    }],
  };
}

/**
 * 解析 Obsidian Markdown
 */
function parseObsidianMarkdown(content: string): {
  type: "concept" | "decision" | "todo" | "note" | "project";
  title: string;
  content: string;
  tags: string[];
  links: string[];
} | null {
  // 提取标题
  const titleMatch = content.match(/^#\s+(.+)/m);
  if (!titleMatch) return null;

  const title = titleMatch[1].trim();

  // 提取标签
  const tagsMatch = content.match(/tags:\s*\[([^\]]+)\]/);
  const tags = tagsMatch
    ? tagsMatch[1].split(",").map(t => t.trim().replace(/^#/, ""))
    : [];

  // 提取链接 [[link]]
  const linksMatch = content.matchAll(/\[\[([^\]]+)\]\]/g);
  const links = Array.from(linksMatch, m => m[1]);

  // 提取正文（移除 YAML frontmatter）
  const bodyMatch = content.match(/^---\n.*?\n---\n(.+)/s);
  const body = bodyMatch ? bodyMatch[1] : content.replace(/^#\s+.+\n/, "");

  // 类型推断
  let type: "concept" | "decision" | "todo" | "note" | "project" = "note";
  if (body.includes("决定") || body.includes("决策")) type = "decision";
  if (body.includes("待办") || body.includes("TODO")) type = "todo";
  if (body.includes("项目") || body.includes("Project")) type = "project";
  if (body.includes("概念") || body.includes("定义")) type = "concept";

  return {
    type,
    title,
    content: body.trim(),
    tags,
    links,
  };
}

/**
 * 格式化为 Obsidian Markdown
 */
function formatObsidianMarkdown(kp: {
  id: string;
  type: string;
  title: string;
  content: string;
  tags: string[];
  links: string[];
  created: string;
  updated: string;
}): string {
  let md = `# ${kp.title}\n\n`;
  md += `---\n`;
  md += `id: ${kp.id}\n`;
  md += `type: ${kp.type}\n`;
  md += `tags: [${kp.tags.map(t => `#${t}`).join(", ")}]\n`;
  md += `created: ${kp.created}\n`;
  md += `updated: ${kp.updated}\n`;
  md += `---\n\n`;
  md += kp.content;

  // 添加链接
  if (kp.links.length > 0) {
    md += `\n\n---\n`;
    md += `## 相关\n`;
    for (const link of kp.links) {
      md += `- [[${link}]]\n`;
    }
  }

  return md;
}
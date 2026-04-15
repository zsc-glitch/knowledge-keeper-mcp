/**
 * knowledge_batch - 批量操作
 * 
 * 支持批量：
 * - 删除
 * - 更新标签
 * - 添加标签
 */

import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { deleteKnowledge, updateKnowledge, searchKnowledge } from "../core.js";

const BatchSchema = z.object({
  action: z.enum(["delete", "add_tags", "remove_tags", "update_type"]).describe("批量操作类型"),
  ids: z.array(z.string()).optional().describe("知识点ID列表"),
  query: z.string().optional().describe("搜索条件（替代ids）"),
  tags: z.array(z.string()).optional().describe("标签列表"),
  type: z.enum(["concept", "decision", "todo", "note", "project"]).optional().describe("知识类型"),
  limit: z.number().min(1).max(100).default(50).describe("批量数量限制"),
});

export function registerBatchTool(server: McpServer): void {
  server.registerTool(
    "knowledge_batch",
    {
      title: "批量操作",
      description: "批量删除、添加/移除标签、修改类型",
      inputSchema: BatchSchema,
    },
    async (params) => {
      const { action, ids, query, tags, type, limit } = params;

      try {
        // 获取要操作的知识点
        let targetIds: string[] = [];

        if (ids && ids.length > 0) {
          targetIds = ids.slice(0, limit);
        } else if (query) {
          const results = await searchKnowledge({
            query,
            limit,
          });
          targetIds = results.map(kp => kp.id);
        } else {
          return {
            content: [{
              type: "text",
              text: `❌ 请提供 ids 或 query 参数`,
            }],
          };
        }

        if (targetIds.length === 0) {
          return {
            content: [{
              type: "text",
              text: `📭 没有找到符合条件的知识点`,
            }],
          };
        }

        // 执行批量操作
        let processed = 0;
        let failed = 0;

        switch (action) {
          case "delete":
            for (const id of targetIds) {
              const success = await deleteKnowledge(id);
              if (success) processed++;
              else failed++;
            }
            break;

          case "add_tags":
            if (!tags || tags.length === 0) {
              return {
                content: [{
                  type: "text",
                  text: `❌ 请提供 tags 参数`,
                }],
              };
            }
            for (const id of targetIds) {
              try {
                await updateKnowledge(id, { appendTags: tags });
                processed++;
              } catch {
                failed++;
              }
            }
            break;

          case "remove_tags":
            if (!tags || tags.length === 0) {
              return {
                content: [{
                  type: "text",
                  text: `❌ 请提供 tags 参数`,
                }],
              };
            }
            // 移除标签需要先获取知识点
            for (const id of targetIds) {
              try {
                // 获取当前标签并过滤
                const kp = await searchKnowledge({ query: id, limit: 1 });
                if (kp.length > 0) {
                  const newTags = kp[0].tags.filter(t => !tags.includes(t));
                  await updateKnowledge(id, { tags: newTags });
                  processed++;
                } else {
                  failed++;
                }
              } catch {
                failed++;
              }
            }
            break;
        }

        // 格式化输出
        let output = `✅ **批量操作完成**\n\n`;
        output += `操作: ${action}\n`;
        output += `成功: ${processed}\n`;
        output += `失败: ${failed}\n`;
        output += `目标: ${targetIds.length} 条\n\n`;

        if (failed > 0) {
          output += `⚠️ 有 ${failed} 条操作失败`;
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
            text: `❌ 批量操作失败: ${error instanceof Error ? error.message : String(error)}`,
          }],
        };
      }
    }
  );
}
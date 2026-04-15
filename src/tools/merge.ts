/**
 * knowledge_merge - 知识合并
 * 
 * 合并相似或重复的知识点
 */

import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { getKnowledge, updateKnowledge, deleteKnowledge, addLink } from "../core.js";

const MergeSchema = z.object({
  primary: z.string().describe("主知识点ID（保留）"),
  secondary: z.string().describe("次要知识点ID（将被合并）"),
  mode: z.enum(["keep_both", "delete_secondary", "link_only"]).default("keep_both").describe("合并模式"),
});

export function registerMergeTool(server: McpServer): void {
  server.registerTool(
    "knowledge_merge",
    {
      title: "知识合并",
      description: "合并相似或重复的知识点",
      inputSchema: MergeSchema,
    },
    async (params) => {
      const { primary, secondary, mode } = params;

      try {
        const primaryKP = await getKnowledge(primary);
        const secondaryKP = await getKnowledge(secondary);

        if (!primaryKP) {
          return {
            content: [{
              type: "text" as const,
              text: `❌ 主知识点不存在: ${primary}`,
            }],
          };
        }

        if (!secondaryKP) {
          return {
            content: [{
              type: "text" as const,
              text: `❌ 次要知识点不存在: ${secondary}`,
            }],
          };
        }

        let output = `✅ **知识合并**\n\n`;
        output += `主: **${primaryKP.title}** (${primaryKP.id})\n`;
        output += `次: **${secondaryKP.title}** (${secondaryKP.id})\n\n`;

        switch (mode) {
          case "keep_both":
            // 合并内容到主知识点，保留两者
            const mergedContent = primaryKP.content + "\n\n---\n\n" + 
              `**来源: ${secondaryKP.title}**\n\n${secondaryKP.content}`;
            const mergedTags = [...new Set([...primaryKP.tags, ...secondaryKP.tags])];
            
            await updateKnowledge(primary, {
              content: mergedContent,
              tags: mergedTags,
            });

            // 创建关联
            await addLink(primary, secondary, "similar", true);

            output += `模式: 保留两者 + 合并内容\n`;
            output += `内容已合并到主知识点\n`;
            output += `已创建 "similar" 关联`;
            break;

          case "delete_secondary":
            // 合并内容后删除次要知识点
            const mergedContent2 = primaryKP.content + "\n\n---\n\n" + 
              `**合并自: ${secondaryKP.title}**\n\n${secondaryKP.content}`;
            const mergedTags2 = [...new Set([...primaryKP.tags, ...secondaryKP.tags])];

            await updateKnowledge(primary, {
              content: mergedContent2,
              tags: mergedTags2,
            });
            await deleteKnowledge(secondary);

            output += `模式: 删除次要知识点\n`;
            output += `内容已合并到主知识点\n`;
            output += `次要知识点已删除`;
            break;

          case "link_only":
            // 只创建关联，不合并内容
            await addLink(primary, secondary, "similar", true);

            output += `模式: 仅创建关联\n`;
            output += `已创建 "similar" 双向关联`;
            break;
        }

        output += `\n\n合并完成 ✅`;

        return {
          content: [{
            type: "text" as const,
            text: output,
          }],
        };
      } catch (error) {
        return {
          content: [{
            type: "text" as const,
            text: `❌ 合并失败: ${error instanceof Error ? error.message : String(error)}`,
          }],
        };
      }
    }
  );
}
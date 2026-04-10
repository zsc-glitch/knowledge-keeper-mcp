/**
 * knowledge_update MCP Tool
 */
import { z } from "zod";
import { updateKnowledge } from "../core.js";
export function registerUpdateTool(server) {
    server.registerTool("knowledge_update", {
        title: "更新知识点",
        description: "更新现有知识点的内容或标签",
        inputSchema: z.object({
            id: z.string().describe("知识点 ID"),
            title: z.string().optional().describe("新标题"),
            content: z.string().optional().describe("新内容"),
            tags: z.array(z.string()).optional().describe("新标签列表"),
            appendTags: z.array(z.string()).optional().describe("追加标签"),
        }),
    }, async (params) => {
        try {
            const kp = await updateKnowledge(params.id, {
                title: params.title,
                content: params.content,
                tags: params.tags,
                appendTags: params.appendTags,
            });
            if (!kp) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `❌ 未找到知识点: ${params.id}`,
                        },
                    ],
                };
            }
            return {
                content: [
                    {
                        type: "text",
                        text: `✅ 知识已更新\n\n📝 **${kp.title}**\nID: ${kp.id}\n标签: ${kp.tags.join(", ") || "无"}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `❌ 更新失败: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
//# sourceMappingURL=update.js.map
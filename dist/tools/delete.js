/**
 * knowledge_delete MCP Tool
 */
import { z } from "zod";
import { deleteKnowledge } from "../core.js";
export function registerDeleteTool(server) {
    server.registerTool("knowledge_delete", {
        title: "删除知识点",
        description: "删除指定知识点",
        inputSchema: z.object({
            id: z.string().describe("要删除的知识点 ID"),
        }),
    }, async (params) => {
        try {
            const deleted = await deleteKnowledge(params.id);
            if (!deleted) {
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
                        text: `🗑️ 已删除知识点\n\nID: ${params.id}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `❌ 删除失败: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
//# sourceMappingURL=delete.js.map
/**
 * knowledge_unlink - 删除知识关联
 */
import { z } from "zod";
import { getKnowledge, removeLink } from "../core.js";
export function registerUnlinkTool(server) {
    server.registerTool("knowledge_unlink", {
        title: "删除知识关联",
        description: "删除知识点之间的关联关系",
        inputSchema: z.object({
            from: z.string().describe("源知识点ID"),
            to: z.string().optional().describe("目标知识点ID（可选，不填则删除所有关联）"),
            relation: z.string().optional().describe("关联类型（可选）"),
        }),
    }, async (params) => {
        const { from, to, relation } = params;
        try {
            const fromKP = await getKnowledge(from);
            if (!fromKP) {
                return {
                    content: [{
                            type: "text",
                            text: `❌ 知识点不存在: ${from}`,
                        }],
                };
            }
            const removed = await removeLink(from, to, relation);
            return {
                content: [{
                        type: "text",
                        text: `✅ 已删除关联\n\n` +
                            `从 **${fromKP.title}** 删除了 ${removed} 个关联`,
                    }],
            };
        }
        catch (error) {
            return {
                content: [{
                        type: "text",
                        text: `❌ 删除关联失败: ${error instanceof Error ? error.message : String(error)}`,
                    }],
            };
        }
    });
}
//# sourceMappingURL=unlink.js.map
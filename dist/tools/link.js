/**
 * knowledge_link - 创建知识关联
 */
import { z } from "zod";
import { getKnowledge, addLink } from "../core.js";
export function registerLinkTool(server) {
    server.registerTool("knowledge_link", {
        title: "创建知识关联",
        description: "建立知识点之间的关联关系，支持多种关联类型",
        inputSchema: z.object({
            from: z.string().describe("源知识点ID"),
            to: z.string().describe("目标知识点ID"),
            relation: z.enum([
                "related",
                "depends-on",
                "references",
                "similar",
                "contradicts",
            ]).default("related").describe("关联类型"),
            bidirectional: z.boolean().default(false).describe("是否双向关联"),
        }),
    }, async (params) => {
        const { from, to, relation, bidirectional } = params;
        try {
            // 检查知识点是否存在
            const fromKP = await getKnowledge(from);
            const toKP = await getKnowledge(to);
            if (!fromKP) {
                return {
                    content: [{
                            type: "text",
                            text: `❌ 源知识点不存在: ${from}`,
                        }],
                };
            }
            if (!toKP) {
                return {
                    content: [{
                            type: "text",
                            text: `❌ 目标知识点不存在: ${to}`,
                        }],
                };
            }
            // 创建关联
            await addLink(from, to, relation, bidirectional);
            // 如果是双向，同时创建反向关联
            if (bidirectional) {
                const reverseRelation = getReverseRelation(relation);
                await addLink(to, from, reverseRelation, false);
            }
            return {
                content: [{
                        type: "text",
                        text: `✅ 已创建关联\n\n` +
                            `**${fromKP.title}** → **${toKP.title}**\n` +
                            `关联类型: ${relation}\n` +
                            `双向: ${bidirectional ? "是" : "否"}\n\n` +
                            `现在可以使用 knowledge_get_linked 查询关联`,
                    }],
            };
        }
        catch (error) {
            return {
                content: [{
                        type: "text",
                        text: `❌ 创建关联失败: ${error instanceof Error ? error.message : String(error)}`,
                    }],
            };
        }
    });
}
function getReverseRelation(relation) {
    const reverseMap = {
        "related": "related",
        "depends-on": "depends-on-by",
        "references": "referenced-by",
        "similar": "similar",
        "contradicts": "contradicts",
    };
    return reverseMap[relation] || relation;
}
//# sourceMappingURL=link.js.map
/**
 * knowledge_graph_query MCP Tool
 * 查询实体关系
 */
import { z } from "zod";
import { queryEntity, queryRelations, getNeighbors } from "../graph.js";
export function registerGraphQueryTool(server) {
    server.registerTool("knowledge_graph_query", {
        title: "查询知识图谱",
        description: "查询实体及其关系",
        inputSchema: z.object({
            action: z.enum(["entity", "relations", "neighbors", "path"]).default("entity").describe("查询类型"),
            entityId: z.string().optional().describe("实体ID"),
            entityName: z.string().optional().describe("实体名称"),
            relationType: z.string().optional().describe("关系类型过滤"),
            depth: z.number().optional().describe("查询深度"),
        }),
    }, async (params) => {
        try {
            const { action, entityId, entityName, relationType, depth } = params;
            const targetId = entityId || entityName || "";
            if (action === "entity") {
                const entity = await queryEntity(targetId);
                if (!entity) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: `❌ 未找到实体: ${targetId}`,
                            },
                        ],
                    };
                }
                return {
                    content: [
                        {
                            type: "text",
                            text: `📋 **实体详情**\n\nID: ${entity.id}\n名称: ${entity.name}\n类型: ${entity.type}\n别名: ${entity.aliases.join(", ") || "无"}\n描述: ${entity.description || "无"}\n来源知识点: ${entity.sourceIds.length} 个\n创建时间: ${entity.created}`,
                        },
                    ],
                };
            }
            if (action === "relations") {
                const relations = await queryRelations(targetId);
                if (relations.length === 0) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: `❌ 未找到关系: ${targetId}`,
                            },
                        ],
                    };
                }
                const filtered = relationType
                    ? relations.filter(r => r.type === relationType)
                    : relations;
                const output = filtered
                    .map(r => `${r.sourceId} → ${r.type} → ${r.targetId} (权重: ${r.weight})`)
                    .join("\n");
                return {
                    content: [
                        {
                            type: "text",
                            text: `🔗 **关系列表** (${filtered.length} 条)\n\n${output}`,
                        },
                    ],
                };
            }
            if (action === "neighbors") {
                const neighbors = await getNeighbors(targetId);
                if (neighbors.length === 0) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: `❌ 未找到邻居节点: ${targetId}`,
                            },
                        ],
                    };
                }
                const output = neighbors
                    .map(n => `- ${n.name} (${n.type}) [${n.id}]`)
                    .join("\n");
                return {
                    content: [
                        {
                            type: "text",
                            text: `👥 **邻居节点** (${neighbors.length} 个)\n\n${output}`,
                        },
                    ],
                };
            }
            // path action (future)
            return {
                content: [
                    {
                        type: "text",
                        text: `⚠️ path 查询尚未实现`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `❌ 查询失败: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
//# sourceMappingURL=graph-query.js.map
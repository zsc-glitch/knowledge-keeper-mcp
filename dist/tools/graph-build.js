/**
 * knowledge_graph_build MCP Tool
 * 构建知识图谱
 */
import { z } from "zod";
import { detectEntities, addEntity, addRelation, getGraphStats, loadGraph, queryEntity, saveGraph, } from "../graph.js";
import { searchKnowledge } from "../core.js";
export function registerGraphBuildTool(server) {
    server.registerTool("knowledge_graph_build", {
        title: "构建知识图谱",
        description: "从知识点中提取实体和关系，构建知识图谱",
        inputSchema: z.object({
            action: z.enum(["build", "update", "clear"]).default("build").describe("操作类型"),
            sourceIds: z.array(z.string()).optional().describe("指定知识点范围"),
            autoDetect: z.boolean().default(true).describe("自动检测实体"),
        }),
    }, async (params) => {
        try {
            const { action, sourceIds, autoDetect } = params;
            if (action === "clear") {
                // 清空图谱
                await clearGraph();
                return {
                    content: [
                        {
                            type: "text",
                            text: `✅ 知识图谱已清空`,
                        },
                    ],
                };
            }
            // 获取知识点
            const knowledge = await searchKnowledge({
                query: "",
                limit: 1000,
            });
            const targetKnowledge = sourceIds
                ? knowledge.filter(kp => sourceIds.includes(kp.id))
                : knowledge;
            let entitiesCreated = 0;
            let relationsCreated = 0;
            if (autoDetect) {
                // 自动检测实体
                for (const kp of targetKnowledge) {
                    const detected = detectEntities(`${kp.title}\n${kp.content}`);
                    for (const d of detected) {
                        await addEntity({
                            name: d.name,
                            type: d.type,
                            aliases: [],
                            sourceIds: [kp.id],
                        });
                        entitiesCreated++;
                    }
                    // 创建知识点到实体的关系
                    for (const d of detected) {
                        const entity = await queryEntity(d.name);
                        if (entity) {
                            await addRelation({
                                sourceId: kp.id,
                                targetId: entity.id,
                                type: "mentions",
                                weight: 0.5,
                                evidence: [kp.id],
                            });
                            relationsCreated++;
                        }
                    }
                }
            }
            const stats = await getGraphStats();
            return {
                content: [
                    {
                        type: "text",
                        text: `✅ 知识图谱构建完成\n\n📊 统计:\n- 实体数量: ${stats.entityCount}\n- 关系数量: ${stats.relationCount}\n- 本次新增实体: ${entitiesCreated}\n- 本次新增关系: ${relationsCreated}\n\n实体类型分布:\n${Object.entries(stats.entityTypeCounts)
                            .filter(([_, count]) => count > 0)
                            .map(([type, count]) => `  - ${type}: ${count}`)
                            .join("\n")}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `❌ 构建失败: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
async function clearGraph() {
    const graph = await loadGraph();
    graph.entities = [];
    graph.relations = [];
    graph.entityNameIndex = {};
    await saveGraph(graph);
}
//# sourceMappingURL=graph-build.js.map
/**
 * MCP Resources 注册
 * 提供知识点的只读访问
 */
import { listTags, searchKnowledge } from "../core.js";
export function registerResources(server) {
    // 资源列表（静态）
    server.registerResource("knowledge-list", "knowledge:///list", {
        title: "知识库概览",
        description: "列出知识库中的所有知识点类型",
        mimeType: "application/json",
    }, async () => {
        const tags = await listTags();
        const tagCount = Object.keys(tags).length;
        const totalEntries = Object.values(tags).reduce((a, b) => a + b, 0);
        return {
            contents: [
                {
                    uri: "knowledge:///list",
                    text: JSON.stringify({
                        message: "知识库资源列表",
                        types: ["concept", "decision", "todo", "note", "project"],
                        stats: {
                            totalTags: tagCount,
                            taggedEntries: totalEntries,
                        },
                        resources: [
                            { uri: "knowledge:///tags", name: "标签索引" },
                            { uri: "knowledge:///type/concept", name: "概念类知识" },
                            { uri: "knowledge:///type/decision", name: "决策类知识" },
                            { uri: "knowledge:///type/todo", name: "待办事项" },
                            { uri: "knowledge:///type/note", name: "笔记" },
                            { uri: "knowledge:///type/project", name: "项目记录" },
                        ],
                        usage: "使用 knowledge:///{id} 访问单个知识点",
                    }, null, 2),
                },
            ],
        };
    });
    // 标签索引
    server.registerResource("knowledge-tags", "knowledge:///tags", {
        title: "标签索引",
        description: "知识库中所有标签的列表",
        mimeType: "application/json",
    }, async () => {
        const tags = await listTags();
        const sortedTags = Object.entries(tags)
            .sort((a, b) => b[1] - a[1])
            .map(([tag, count]) => ({ tag, count }));
        return {
            contents: [
                {
                    uri: "knowledge:///tags",
                    text: JSON.stringify({
                        total: sortedTags.length,
                        tags: sortedTags,
                    }, null, 2),
                },
            ],
        };
    });
    // 按类型列出
    const types = ["concept", "decision", "todo", "note", "project"];
    const typeNames = {
        concept: "概念类知识",
        decision: "决策类知识",
        todo: "待办事项",
        note: "笔记",
        project: "项目记录",
    };
    for (const type of types) {
        server.registerResource(`knowledge-type-${type}`, `knowledge:///type/${type}`, {
            title: typeNames[type],
            description: `列出所有${typeNames[type]}`,
            mimeType: "application/json",
        }, async () => {
            const results = await searchKnowledge({
                query: "",
                type,
                limit: 100,
            });
            return {
                contents: [
                    {
                        uri: `knowledge:///type/${type}`,
                        text: JSON.stringify({
                            type,
                            name: typeNames[type],
                            count: results.length,
                            entries: results.map((kp) => ({
                                id: kp.id,
                                title: kp.title,
                                tags: kp.tags,
                                created: kp.created,
                            })),
                        }, null, 2),
                    },
                ],
            };
        });
    }
}
//# sourceMappingURL=index.js.map
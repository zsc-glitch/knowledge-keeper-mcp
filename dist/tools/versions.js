/**
 * knowledge_versions MCP Tool
 * 查询知识点版本历史
 */
import { z } from "zod";
export function registerVersionsTool(server) {
    server.registerTool("knowledge_versions", {
        title: "版本历史",
        description: "查询知识点的版本历史记录",
        inputSchema: z.object({
            id: z.string().describe("知识点 ID"),
        }),
    }, async (params) => {
        // TODO: 实现版本历史查询
        // 需要从主插件迁移 version.ts 功能
        return {
            content: [
                {
                    type: "text",
                    text: `📝 知识点版本历史\n\nID: ${params.id}\n\n版本历史功能开发中...\n\n提示：完整版本历史功能需要安装 OpenClaw 插件版 @zsc-glitch/knowledge-keeper`,
                },
            ],
        };
    });
}
//# sourceMappingURL=versions.js.map
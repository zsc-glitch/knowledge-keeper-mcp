/**
 * Knowledge Versions MCP Tool
 * Query version history, diff versions, rollback
 */

import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import {
  getVersionHistory,
  getVersion,
  diffVersions,
  rollbackToVersion,
} from "../versions.js";
import { updateKnowledge, getKnowledge } from "../core.js";

export function registerVersionsTool(server: McpServer): void {
  server.registerTool(
    "knowledge_versions",
    {
      title: "版本历史",
      description: "查询知识点的版本历史记录，支持查看、对比和回滚",
      inputSchema: z.object({
        id: z.string().describe("知识点 ID"),
        action: z.enum(["list", "get", "diff", "rollback"]).default("list").describe("操作类型：list=列表, get=获取版本, diff=对比, rollback=回滚"),
        version: z.number().optional().describe("版本号（get/rollback 时使用）"),
        compareWith: z.number().optional().describe("对比版本号（diff 时使用，与 version 对比）"),
      }),
    },
    async (params) => {
      try {
        const { id, action, version, compareWith } = params;

        if (action === "list") {
          const history = await getVersionHistory(id);
          if (!history || history.versions.length === 0) {
            return {
              content: [{ type: "text", text: `📝 知识点 ${id}\n\n暂无版本历史记录。\n\n版本会在每次更新时自动记录。` }],
            };
          }

          const versionLines = history.versions
            .slice(-20) // Show last 20 versions
            .map(v => `  v${v.version} — ${v.timestamp.substring(0, 19)} — ${v.title}${v.tags.length ? ` [${v.tags.join(", ")}]` : ""}`)
            .join("\n");

          return {
            content: [{
              type: "text",
              text: `📝 版本历史 — ${id}\n\n当前版本: v${history.currentVersion}\n总版本数: ${history.versions.length}\n\n${versionLines}\n\n💡 使用 action="get" 查看特定版本\n💡 使用 action="diff" 对比两个版本\n💡 使用 action="rollback" 回滚到指定版本`,
            }],
          };
        }

        if (action === "get") {
          if (!version) {
            return { content: [{ type: "text", text: `❌ 请指定 version 参数` }] };
          }
          const v = await getVersion(id, version);
          if (!v) {
            return { content: [{ type: "text", text: `❌ 版本 v${version} 不存在` }] };
          }
          return {
            content: [{
              type: "text",
              text: `📄 版本 v${v.version} — ${id}\n\n时间: ${v.timestamp}\n标题: ${v.title}\n标签: ${v.tags.join(", ") || "无"}\n来源: ${v.source}\n\n---\n${v.content}`,
            }],
          };
        }

        if (action === "diff") {
          if (!version || !compareWith) {
            return { content: [{ type: "text", text: `❌ 请指定 version 和 compareWith 参数` }] };
          }
          const diffs = await diffVersions(id, version, compareWith);
          if (!diffs) {
            return { content: [{ type: "text", text: `❌ 无法对比版本 v${version} 和 v${compareWith}` }] };
          }
          if (diffs.length === 0) {
            return { content: [{ type: "text", text: `✅ 版本 v${version} 和 v${compareWith} 完全相同` }] };
          }

          const diffLines = diffs.map(d =>
            `📌 ${d.field}:\n  旧 (v${version}): ${d.old.substring(0, 200)}${d.old.length > 200 ? "..." : ""}\n  新 (v${compareWith}): ${d.new.substring(0, 200)}${d.new.length > 200 ? "..." : ""}`
          ).join("\n\n");

          return {
            content: [{ type: "text", text: `🔄 版本对比 — ${id}\n\nv${version} → v${compareWith}\n\n${diffLines}` }],
          };
        }

        if (action === "rollback") {
          if (!version) {
            return { content: [{ type: "text", text: `❌ 请指定 version 参数` }] };
          }
          const data = await rollbackToVersion(id, version);
          if (!data) {
            return { content: [{ type: "text", text: `❌ 版本 v${version} 不存在` }] };
          }

          // Apply the rollback
          const updated = await updateKnowledge(id, {
            title: data.title,
            content: data.content,
            tags: data.tags,
          });

          if (!updated) {
            return { content: [{ type: "text", text: `❌ 回滚失败：知识点 ${id} 不存在` }] };
          }

          return {
            content: [{ type: "text", text: `✅ 已回滚到版本 v${version}\n\n知识点 ${id} 已更新为 v${version} 的内容。\n标题: ${data.title}\n标签: ${data.tags.join(", ") || "无"}` }],
          };
        }

        return { content: [{ type: "text", text: `❌ 未知操作: ${action}` }] };
      } catch (error) {
        return {
          content: [{ type: "text", text: `❌ 操作失败: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );
}

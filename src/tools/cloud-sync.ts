/**
 * Cloud Sync MCP Tools (Pro Feature)
 * Sync, status, and license management
 */

import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { fullSync, pushChanges, pullChanges, getSyncStatus, validateLicense, type SyncConfig } from "../cloud-sync.js";

function getSyncConfigFromEnv(): SyncConfig | null {
  const serverUrl = process.env.KK_SYNC_URL;
  const apiKey = process.env.KK_API_KEY;
  const encryptionKey = process.env.KK_ENCRYPTION_KEY;
  const vaultPath = process.env.KK_VAULT_PATH || process.cwd();

  if (!serverUrl || !apiKey || !encryptionKey) {
    return null;
  }

  return { serverUrl, apiKey, encryptionKey, vaultPath };
}

export function registerCloudSyncTools(server: McpServer): void {
  // Sync status
  server.registerTool(
    "knowledge_sync_status",
    {
      title: "同步状态",
      description: "检查云同步状态（Pro功能）",
      inputSchema: z.object({}),
    },
    async () => {
      const config = getSyncConfigFromEnv();
      if (!config) {
        return {
          content: [
            {
              type: "text",
              text: `⚠️ 云同步未配置\n\n设置以下环境变量启用：\n- KK_SYNC_URL: 同步服务器地址\n- KK_API_KEY: API密钥（Pro订阅）\n- KK_ENCRYPTION_KEY: 加密密钥\n\n🔒 升级到 Pro: https://knowledge-keeper-mcp.zsc-glitch.dev`,
            },
          ],
        };
      }

      try {
        const status = await getSyncStatus(config.vaultPath);
        return {
          content: [
            {
              type: "text",
              text: `📊 同步状态\n\n- 状态: ${status.status}\n- 上次同步: ${status.lastSyncAt || "从未"}\n- 已同步项目: ${status.syncedItems}\n- 待推送变更: ${status.pendingChanges}\n- 冲突数: ${status.conflicts}${status.error ? `\n- 错误: ${status.error}` : ""}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `❌ 获取状态失败: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    }
  );

  // Sync now
  server.registerTool(
    "knowledge_sync",
    {
      title: "云同步",
      description: "执行完整云同步（拉取+推送），端到端加密（Pro功能）",
      inputSchema: z.object({
        direction: z.enum(["full", "push", "pull"]).default("full").describe("同步方向：full=双向, push=仅推送, pull=仅拉取"),
      }),
    },
    async (params) => {
      const config = getSyncConfigFromEnv();
      if (!config) {
        return {
          content: [
            {
              type: "text",
              text: `⚠️ 云同步未配置\n\n设置环境变量 KK_SYNC_URL, KK_API_KEY, KK_ENCRYPTION_KEY\n\n🔒 升级到 Pro: https://knowledge-keeper-mcp.zsc-glitch.dev`,
            },
          ],
        };
      }

      try {
        let result;
        switch (params.direction) {
          case "push":
            result = await pushChanges(config);
            break;
          case "pull":
            result = await pullChanges(config);
            break;
          default:
            result = await fullSync(config);
        }

        const prefix = params.direction === "full" ? "双向同步" : params.direction === "push" ? "推送" : "拉取";
        return {
          content: [
            {
              type: "text",
              text: `✅ ${prefix}完成\n\n📊 结果:\n- 推送: ${"pushed" in result ? result.pushed : 0} 项\n- 拉取: ${"pulled" in result ? result.pulled : 0} 项\n- 冲突: ${result.conflicts} 项${result.error ? `\n- 错误: ${result.error}` : ""}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `❌ 同步失败: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    }
  );

  // License info
  server.registerTool(
    "knowledge_license",
    {
      title: "许可证信息",
      description: "查看当前许可证和功能",
      inputSchema: z.object({}),
    },
    async () => {
      const apiKey = process.env.KK_API_KEY || "";
      try {
        const info = await validateLicense(apiKey);
        return {
          content: [
            {
              type: "text",
              text: `📋 许可证信息\n\n- 版本: ${info.tier.toUpperCase()}\n- 过期时间: ${info.expiresAt || "永久"}\n- 功能: ${info.features.join(", ")}${info.tier === "free" ? "\n\n🔒 升级到 Pro 解锁：\n- ☁️ 端到端加密云同步\n- 📱 多设备访问\n- 📊 高级分析\n- 🎯 优先支持\n\n👉 https://knowledge-keeper-mcp.zsc-glitch.dev" : ""}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `❌ 获取许可证失败: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    }
  );
}

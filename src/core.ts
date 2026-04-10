/**
 * Knowledge Keeper Core
 * 核心逻辑，不依赖 OpenClaw SDK，可被 MCP Server 复用
 */

import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import {
  addToVectorIndex,
  removeFromVectorIndex,
  semanticSearch as vectorSemanticSearch,
  getVectorIndexStats,
} from "./embedding.js";

// 知识类型
export type KnowledgeType = "concept" | "decision" | "todo" | "note" | "project";

// 知识点结构
export interface KnowledgePoint {
  id: string;
  type: KnowledgeType;
  title: string;
  content: string;
  tags: string[];
  links: string[];
  created: string;
  updated: string;
  source: "conversation" | "manual" | "mcp";
}

// 索引结构
interface KnowledgeIndex {
  version: number;
  entries: KnowledgePoint[];
  tagsIndex: Record<string, string[]>; // tag -> [id1, id2, ...]
}

// 错误类型
export class KnowledgeError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "KnowledgeError";
  }
}

// 获取知识库目录
export function getVaultDir(): string {
  const dir = process.env.KNOWLEDGE_KEEPER_DIR || "~/.knowledge-vault";
  return dir.replace("~", os.homedir());
}

// 生成知识点 ID（类型前缀 + 时间戳 + 随机）
export function generateId(type: KnowledgeType): string {
  const prefix: Record<KnowledgeType, string> = {
    concept: "kp-cp",
    decision: "kp-dc",
    todo: "kp-td",
    note: "kp-nt",
    project: "kp-pj",
  };
  const timestamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix[type]}-${timestamp}-${rand}`;
}

// 确保目录存在
async function ensureDir(dir: string): Promise<void> {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "EEXIST") {
      throw new KnowledgeError(`无法创建目录: ${dir}`, "DIR_CREATE_FAILED", { dir, error: err });
    }
  }
}

// 获取类型对应的子目录
function getTypeDir(type: KnowledgeType): string {
  const dirs: Record<KnowledgeType, string> = {
    concept: "concepts",
    decision: "decisions",
    todo: "todos",
    note: "notes",
    project: "projects",
  };
  return dirs[type];
}

// 从 ID 解析类型
function parseTypeFromId(id: string): KnowledgeType | null {
  const prefix = id.slice(0, 5);
  const map: Record<string, KnowledgeType> = {
    "kp-cp": "concept",
    "kp-dc": "decision",
    "kp-td": "todo",
    "kp-nt": "note",
    "kp-pj": "project",
  };
  return map[prefix] || null;
}

// 格式化知识点为 Markdown
function formatMarkdown(kp: KnowledgePoint): string {
  return `---
id: ${kp.id}
type: ${kp.type}
title: ${kp.title.replace(/\n/g, " ")}
tags: [${kp.tags.join(", ")}]
links: [${(kp.links || []).join(", ")}]
created: ${kp.created}
updated: ${kp.updated}
source: ${kp.source}
---

# ${kp.title}

${kp.content}
`;
}

// 解析 Markdown 为知识点
function parseMarkdown(content: string, filepath?: string): KnowledgePoint | null {
  try {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!frontmatterMatch) return null;

    const [, frontmatter, body] = frontmatterMatch;
    const lines = frontmatter.split("\n");
    const meta: Record<string, string> = {};

    for (const line of lines) {
      const colonIndex = line.indexOf(":");
      if (colonIndex > 0) {
        const key = line.slice(0, colonIndex).trim();
        const value = line.slice(colonIndex + 1).trim();
        meta[key] = value;
      }
    }

    const titleMatch = body.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : "Untitled";
    const contentWithoutTitle = body.replace(/^#\s+.+\n/, "").trim();

    const tagsMatch = meta.tags?.match(/\[([^\]]*)\]/);
    const tags = tagsMatch ? tagsMatch[1].split(",").map((t) => t.trim()).filter(Boolean) : [];

    const linksMatch = meta.links?.match(/\[([^\]]*)\]/);
    const links = linksMatch ? linksMatch[1].split(",").map((l) => l.trim()).filter(Boolean) : [];

    return {
      id: meta.id || generateId((meta.type as KnowledgeType) || "note"),
      type: (meta.type as KnowledgeType) || "note",
      title,
      content: contentWithoutTitle,
      tags,
      links,
      created: meta.created || new Date().toISOString(),
      updated: meta.updated || new Date().toISOString(),
      source: (meta.source as "conversation" | "manual" | "mcp") || "manual",
    };
  } catch {
    return null;
  }
}

// 通过 ID 查找知识点文件路径
async function findKnowledgeFile(vaultDir: string, id: string): Promise<string | null> {
  // 尝试从 ID 解析类型
  const type = parseTypeFromId(id);
  if (type) {
    const typeDir = path.join(vaultDir, getTypeDir(type));
    const filepath = path.join(typeDir, `${id}.md`);
    try {
      await fs.access(filepath);
      return filepath;
    } catch {
      return null;
    }
  }

  // 兼容旧 ID 格式：遍历所有类型
  const types: KnowledgeType[] = ["concept", "decision", "todo", "note", "project"];
  for (const t of types) {
    const typeDir = path.join(vaultDir, getTypeDir(t));
    const filepath = path.join(typeDir, `${id}.md`);
    try {
      await fs.access(filepath);
      return filepath;
    } catch {
      continue;
    }
  }
  return null;
}

// 加载索引
async function loadIndex(vaultDir: string): Promise<KnowledgeIndex> {
  const indexPath = path.join(vaultDir, "index.json");
  try {
    const content = await fs.readFile(indexPath, "utf-8");
    const parsed = JSON.parse(content);
    return {
      version: parsed.version || 1,
      entries: parsed.entries || [],
      tagsIndex: parsed.tagsIndex || {},
    };
  } catch {
    return { version: 1, entries: [], tagsIndex: {} };
  }
}

// 更新索引
async function updateIndex(
  vaultDir: string,
  kp: KnowledgePoint,
  mode: "add" | "remove" | "update" = "add"
): Promise<void> {
  const index = await loadIndex(vaultDir);

  if (mode === "add") {
    index.entries.push(kp);
    for (const tag of kp.tags) {
      if (!index.tagsIndex[tag]) index.tagsIndex[tag] = [];
      if (!index.tagsIndex[tag].includes(kp.id)) index.tagsIndex[tag].push(kp.id);
    }
  } else if (mode === "remove") {
    const removed = index.entries.find((e) => e.id === kp.id);
    index.entries = index.entries.filter((e) => e.id !== kp.id);
    if (removed) {
      for (const tag of removed.tags) {
        if (index.tagsIndex[tag]) {
          index.tagsIndex[tag] = index.tagsIndex[tag].filter((id) => id !== kp.id);
          if (index.tagsIndex[tag].length === 0) delete index.tagsIndex[tag];
        }
      }
    }
  } else if (mode === "update") {
    const idx = index.entries.findIndex((e) => e.id === kp.id);
    const oldKp = idx >= 0 ? index.entries[idx] : null;
    if (idx >= 0) {
      index.entries[idx] = kp;
    } else {
      index.entries.push(kp);
    }
    // 更新标签索引
    if (oldKp) {
      for (const tag of oldKp.tags) {
        if (!kp.tags.includes(tag) && index.tagsIndex[tag]) {
          index.tagsIndex[tag] = index.tagsIndex[tag].filter((id) => id !== kp.id);
          if (index.tagsIndex[tag].length === 0) delete index.tagsIndex[tag];
        }
      }
    }
    for (const tag of kp.tags) {
      if (!index.tagsIndex[tag]) index.tagsIndex[tag] = [];
      if (!index.tagsIndex[tag].includes(kp.id)) index.tagsIndex[tag].push(kp.id);
    }
  }

  const indexPath = path.join(vaultDir, "index.json");
  const tmpPath = path.join(vaultDir, "index.json.tmp");
  await fs.writeFile(tmpPath, JSON.stringify(index, null, 2), "utf-8");
  await fs.rename(tmpPath, indexPath);
}

// ==================== 公开 API ====================

// 保存知识点
export async function saveKnowledge(params: {
  type: KnowledgeType;
  title: string;
  content: string;
  tags?: string[];
  links?: string[];
}): Promise<KnowledgePoint> {
  const vaultDir = getVaultDir();
  const typeDir = getTypeDir(params.type);
  const targetDir = path.join(vaultDir, typeDir);

  await ensureDir(targetDir);

  const kp: KnowledgePoint = {
    id: generateId(params.type),
    type: params.type,
    title: params.title,
    content: params.content,
    tags: params.tags || [],
    links: params.links || [],
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    source: "mcp",
  };

  const filepath = path.join(targetDir, `${kp.id}.md`);
  await fs.writeFile(filepath, formatMarkdown(kp), "utf-8");
  await updateIndex(vaultDir, kp, "add");

  // 添加到向量索引（异步，不阻塞）
  addToVectorIndex({
    id: kp.id,
    title: kp.title,
    content: kp.content,
  }).catch(() => {});

  return kp;
}

// 搜索知识点
export async function searchKnowledge(params: {
  query: string;
  type?: KnowledgeType;
  tags?: string[];
  limit?: number;
}): Promise<KnowledgePoint[]> {
  const vaultDir = getVaultDir();
  const index = await loadIndex(vaultDir);
  const limit = Math.min(params.limit || 10, 50);
  const results: KnowledgePoint[] = [];

  // 筛选候选 ID
  let candidateIds: Set<string> | null = null;
  if (params.tags && params.tags.length > 0) {
    for (const tag of params.tags) {
      const tagLower = tag.toLowerCase();
      const matchingIds: string[] = Object.entries(index.tagsIndex)
        .filter(([t]) => t.toLowerCase().includes(tagLower))
        .flatMap(([, ids]) => ids);
      const idSet = new Set<string>(matchingIds);
      if (candidateIds === null) {
        candidateIds = idSet;
      } else {
        const existingIds: string[] = [...candidateIds];
        candidateIds = new Set<string>(existingIds.filter((id: string) => idSet.has(id)));
      }
    }
  }

  // 确定搜索范围
  const types: KnowledgeType[] = params.type ? [params.type] : ["concept", "decision", "todo", "note", "project"];

  for (const type of types) {
    const typeDir = path.join(vaultDir, getTypeDir(type));
    try {
      const files = await fs.readdir(typeDir);
      for (const file of files) {
        if (!file.endsWith(".md")) continue;

        const id = file.replace(/\.md$/, "");
        if (candidateIds !== null && !candidateIds.has(id)) continue;

        const filepath = path.join(typeDir, file);
        const content = await fs.readFile(filepath, "utf-8");
        const kp = parseMarkdown(content, filepath);

        if (!kp) continue;

        const queryLower = params.query.toLowerCase();
        const matchesQuery =
          kp.title.toLowerCase().includes(queryLower) || kp.content.toLowerCase().includes(queryLower);

        const matchesTags =
          !params.tags ||
          params.tags.every((tag) => kp.tags.some((t) => t.toLowerCase().includes(tag.toLowerCase())));

        if (matchesQuery && matchesTags) {
          results.push(kp);
          if (results.length >= limit) break;
        }
      }
    } catch {
      continue;
    }
    if (results.length >= limit) break;
  }

  return results;
}

// 获取单个知识点
export async function getKnowledge(id: string): Promise<KnowledgePoint | null> {
  const vaultDir = getVaultDir();
  const filepath = await findKnowledgeFile(vaultDir, id);
  if (!filepath) return null;

  const content = await fs.readFile(filepath, "utf-8");
  return parseMarkdown(content, filepath);
}

// 更新知识点
export async function updateKnowledge(
  id: string,
  params: {
    title?: string;
    content?: string;
    tags?: string[];
    appendTags?: string[];
  }
): Promise<KnowledgePoint | null> {
  const vaultDir = getVaultDir();
  const filepath = await findKnowledgeFile(vaultDir, id);
  if (!filepath) return null;

  const content = await fs.readFile(filepath, "utf-8");
  const kp = parseMarkdown(content, filepath);
  if (!kp) return null;

  if (params.title) kp.title = params.title;
  if (params.content) kp.content = params.content;
  if (params.tags) {
    kp.tags = params.tags;
  } else if (params.appendTags) {
    kp.tags = [...new Set([...kp.tags, ...params.appendTags])];
  }
  kp.updated = new Date().toISOString();

  await fs.writeFile(filepath, formatMarkdown(kp), "utf-8");
  await updateIndex(vaultDir, kp, "update");

  return kp;
}

// 删除知识点
export async function deleteKnowledge(id: string): Promise<boolean> {
  const vaultDir = getVaultDir();
  const filepath = await findKnowledgeFile(vaultDir, id);
  if (!filepath) return false;

  const content = await fs.readFile(filepath, "utf-8");
  const kp = parseMarkdown(content, filepath);
  if (!kp) return false;

  await fs.unlink(filepath);
  await updateIndex(vaultDir, kp, "remove");

  // 从向量索引删除（异步，不阻塞）
  removeFromVectorIndex(id).catch(() => {});

  return true;
}

// 列出所有标签
export async function listTags(): Promise<Record<string, number>> {
  const vaultDir = getVaultDir();
  const index = await loadIndex(vaultDir);

  const tagsWithCount: Record<string, number> = {};
  for (const [tag, ids] of Object.entries(index.tagsIndex)) {
    tagsWithCount[tag] = ids.length;
  }

  return tagsWithCount;
}

// 回顾知识点
export async function reviewKnowledge(params: {
  period?: "today" | "week" | "month" | "all";
  type?: KnowledgeType;
}): Promise<{ stats: Record<KnowledgeType, number>; recent: KnowledgePoint[] }> {
  const vaultDir = getVaultDir();
  const period = params.period || "week";

  const now = new Date();
  let startDate: Date;
  switch (period) {
    case "today":
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      break;
    case "week":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "month":
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(0);
  }

  const types: KnowledgeType[] = params.type ? [params.type] : ["concept", "decision", "todo", "note", "project"];
  const results: KnowledgePoint[] = [];

  for (const type of types) {
    const typeDir = path.join(vaultDir, getTypeDir(type));
    try {
      const files = await fs.readdir(typeDir);
      for (const file of files) {
        if (!file.endsWith(".md")) continue;

        const filepath = path.join(typeDir, file);
        const content = await fs.readFile(filepath, "utf-8");
        const kp = parseMarkdown(content, filepath);

        if (kp && new Date(kp.created) >= startDate) {
          results.push(kp);
        }
      }
    } catch {
      continue;
    }
  }

  results.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

  const stats: Record<KnowledgeType, number> = { concept: 0, decision: 0, todo: 0, note: 0, project: 0 };
  for (const kp of results) stats[kp.type]++;

  return { stats, recent: results.slice(0, 10) };
}

// 语义搜索
export async function semanticSearch(params: {
  query: string;
  topK?: number;
  threshold?: number;
}): Promise<
  Array<{
    id: string;
    title: string;
    content: string;
    type: KnowledgeType;
    tags: string[];
    similarity: number;
  }>
> {
  // 使用向量搜索
  const vectorResults = await vectorSemanticSearch({
    query: params.query,
    topK: params.topK,
    threshold: params.threshold,
  });

  // 获取完整的知识点内容
  const results: Array<{
    id: string;
    title: string;
    content: string;
    type: KnowledgeType;
    tags: string[];
    similarity: number;
  }> = [];

  for (const vr of vectorResults) {
    const kp = await getKnowledge(vr.id);
    if (kp) {
      results.push({
        id: kp.id,
        title: kp.title,
        content: kp.content,
        type: kp.type,
        tags: kp.tags,
        similarity: vr.similarity,
      });
    }
  }

  return results;
}

// 获取向量索引统计
export async function getSemanticStats(): Promise<{
  count: number;
  model: string;
  dimension: number;
}> {
  return getVectorIndexStats();
}
/**
 * Semantic Search Module
 * 语义搜索模块 - 使用向量嵌入实现真正的语义搜索
 *
 * 技术方案：
 * - 默认: TF-IDF 嵌入（轻量，无依赖）
 * - 可选: @xenova/transformers 模型（需要安装额外依赖）
 *
 * 配置:
 * - EMBEDDING_MODEL=tfidf (默认) 或 transformers
 */

import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";

// 向量类型
type Vector = number[];

// 向量索引条目
interface VectorEntry {
  id: string;
  vector: Vector;
  title: string;
  contentPreview: string;
  timestamp: number;
}

// 向量索引
interface VectorIndex {
  version: number;
  entries: VectorEntry[];
  model: string;
  dimension: number;
}

// 嵌入模型接口
interface EmbeddingModel {
  embed(text: string): Promise<Vector>;
  dimension: number;
  modelName: string;
}

// ==================== 简单嵌入实现 ====================

/**
 * 基于 TF-IDF 的简单嵌入
 * 不依赖外部模型，适合快速原型
 */
class TFIDFEmbedding implements EmbeddingModel {
  dimension = 128;
  modelName = "tfidf-simple";
  private vocabulary: Map<string, number> = new Map();
  private idf: Map<string, number> = new Map();
  private documentCount = 0;

  async embed(text: string): Promise<Vector> {
    const tokens = this.tokenize(text);
    const tf = new Map<string, number>();

    // 计算词频
    for (const token of tokens) {
      tf.set(token, (tf.get(token) || 0) + 1);
    }

    // 归一化
    const maxTf = Math.max(...tf.values(), 1);

    // 创建向量
    const vector: Vector = new Array(this.dimension).fill(0);

    for (const [token, freq] of tf) {
      const idx = this.getOrAssignIndex(token);
      if (idx < this.dimension) {
        const tfidf = (freq / maxTf) * (this.idf.get(token) || 1);
        vector[idx] = tfidf;
      }
    }

    // L2 归一化
    return this.normalize(vector);
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fff]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 1);
  }

  private getOrAssignIndex(token: string): number {
    if (this.vocabulary.has(token)) {
      return this.vocabulary.get(token)!;
    }
    const idx = this.vocabulary.size;
    if (idx < this.dimension) {
      this.vocabulary.set(token, idx);
    }
    return idx;
  }

  private normalize(vector: Vector): Vector {
    const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    if (norm === 0) return vector;
    return vector.map((v) => v / norm);
  }

  // 更新 IDF（训练时使用）
  train(documents: string[]): void {
    this.documentCount = documents.length;
    const df = new Map<string, number>();

    for (const doc of documents) {
      const tokens = new Set(this.tokenize(doc));
      for (const token of tokens) {
        df.set(token, (df.get(token) || 0) + 1);
      }
    }

    for (const [token, freq] of df) {
      this.idf.set(token, Math.log(this.documentCount / (freq + 1)) + 1);
    }
  }
}

// ==================== 向量存储 ====================

function getVectorIndexPath(): string {
  const dir = process.env.KNOWLEDGE_KEEPER_DIR || "~/.knowledge-vault";
  return path.join(dir.replace("~", os.homedir()), "vectors.json");
}

async function loadVectorIndex(): Promise<VectorIndex> {
  const indexPath = getVectorIndexPath();
  try {
    const content = await fs.readFile(indexPath, "utf-8");
    const parsed = JSON.parse(content);
    return {
      version: parsed.version || 1,
      entries: parsed.entries || [],
      model: parsed.model || "tfidf-simple",
      dimension: parsed.dimension || 128,
    };
  } catch {
    return {
      version: 1,
      entries: [],
      model: "tfidf-simple",
      dimension: 128,
    };
  }
}

async function saveVectorIndex(index: VectorIndex): Promise<void> {
  const indexPath = getVectorIndexPath();
  const dir = path.dirname(indexPath);
  await fs.mkdir(dir, { recursive: true });

  const tmpPath = indexPath + ".tmp";
  await fs.writeFile(tmpPath, JSON.stringify(index, null, 2), "utf-8");
  await fs.rename(tmpPath, indexPath);
}

// ==================== 相似度计算 ====================

function cosineSimilarity(a: Vector, b: Vector): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

// ==================== 公开 API ====================

// 全局嵌入模型实例
let embeddingModel: EmbeddingModel | null = null;

function getEmbeddingModel(): EmbeddingModel {
  if (!embeddingModel) {
    embeddingModel = new TFIDFEmbedding();
  }
  return embeddingModel;
}

/**
 * 为知识点生成嵌入向量
 */
export async function embedKnowledge(params: {
  id: string;
  title: string;
  content: string;
}): Promise<Vector> {
  const model = getEmbeddingModel();
  const text = `${params.title}\n${params.content}`;
  return model.embed(text);
}

/**
 * 将知识点添加到向量索引
 */
export async function addToVectorIndex(params: {
  id: string;
  title: string;
  content: string;
}): Promise<void> {
  const index = await loadVectorIndex();
  const model = getEmbeddingModel();

  // 检查是否已存在
  const existingIdx = index.entries.findIndex((e) => e.id === params.id);
  if (existingIdx >= 0) {
    // 更新现有条目
    const vector = await model.embed(`${params.title}\n${params.content}`);
    index.entries[existingIdx] = {
      id: params.id,
      vector,
      title: params.title,
      contentPreview: params.content.slice(0, 200),
      timestamp: Date.now(),
    };
  } else {
    // 添加新条目
    const vector = await model.embed(`${params.title}\n${params.content}`);
    index.entries.push({
      id: params.id,
      vector,
      title: params.title,
      contentPreview: params.content.slice(0, 200),
      timestamp: Date.now(),
    });
  }

  await saveVectorIndex(index);
}

/**
 * 从向量索引中删除
 */
export async function removeFromVectorIndex(id: string): Promise<void> {
  const index = await loadVectorIndex();
  index.entries = index.entries.filter((e) => e.id !== id);
  await saveVectorIndex(index);
}

/**
 * 语义搜索
 */
export async function semanticSearch(params: {
  query: string;
  topK?: number;
  threshold?: number;
}): Promise<
  Array<{
    id: string;
    title: string;
    contentPreview: string;
    similarity: number;
  }>
> {
  const index = await loadVectorIndex();
  const model = getEmbeddingModel();
  const queryVector = await model.embed(params.query);

  const topK = Math.min(params.topK || 10, 50);
  const threshold = params.threshold || 0.3;

  // 计算所有条目的相似度
  const results = index.entries
    .map((entry) => ({
      id: entry.id,
      title: entry.title,
      contentPreview: entry.contentPreview,
      similarity: cosineSimilarity(queryVector, entry.vector),
    }))
    .filter((r) => r.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);

  return results;
}

/**
 * 重建整个向量索引
 */
export async function rebuildVectorIndex(
  knowledgePoints: Array<{ id: string; title: string; content: string }>
): Promise<number> {
  const model = getEmbeddingModel();
  const entries: VectorEntry[] = [];

  for (const kp of knowledgePoints) {
    const vector = await model.embed(`${kp.title}\n${kp.content}`);
    entries.push({
      id: kp.id,
      vector,
      title: kp.title,
      contentPreview: kp.content.slice(0, 200),
      timestamp: Date.now(),
    });
  }

  const index: VectorIndex = {
    version: 1,
    entries,
    model: model.modelName,
    dimension: model.dimension,
  };

  await saveVectorIndex(index);
  return entries.length;
}

/**
 * 获取向量索引统计
 */
export async function getVectorIndexStats(): Promise<{
  count: number;
  model: string;
  dimension: number;
}> {
  const index = await loadVectorIndex();
  return {
    count: index.entries.length,
    model: index.model,
    dimension: index.dimension,
  };
}
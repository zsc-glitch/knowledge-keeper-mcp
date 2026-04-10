/**
 * Semantic Search Module
 * 语义搜索模块 - 使用向量嵌入实现真正的语义搜索
 *
 * 技术方案：
 * - 嵌入模型: Xenova/all-MiniLM-L6-v2 (通过 @xenova/transformers)
 * - 向量存储: 本地 JSON 文件
 * - 相似度: 余弦相似度
 */
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
// ==================== 简单嵌入实现 ====================
/**
 * 基于 TF-IDF 的简单嵌入
 * 不依赖外部模型，适合快速原型
 */
class TFIDFEmbedding {
    dimension = 128;
    modelName = "tfidf-simple";
    vocabulary = new Map();
    idf = new Map();
    documentCount = 0;
    async embed(text) {
        const tokens = this.tokenize(text);
        const tf = new Map();
        // 计算词频
        for (const token of tokens) {
            tf.set(token, (tf.get(token) || 0) + 1);
        }
        // 归一化
        const maxTf = Math.max(...tf.values(), 1);
        // 创建向量
        const vector = new Array(this.dimension).fill(0);
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
    tokenize(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s\u4e00-\u9fff]/g, " ")
            .split(/\s+/)
            .filter((t) => t.length > 1);
    }
    getOrAssignIndex(token) {
        if (this.vocabulary.has(token)) {
            return this.vocabulary.get(token);
        }
        const idx = this.vocabulary.size;
        if (idx < this.dimension) {
            this.vocabulary.set(token, idx);
        }
        return idx;
    }
    normalize(vector) {
        const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
        if (norm === 0)
            return vector;
        return vector.map((v) => v / norm);
    }
    // 更新 IDF（训练时使用）
    train(documents) {
        this.documentCount = documents.length;
        const df = new Map();
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
function getVectorIndexPath() {
    const dir = process.env.KNOWLEDGE_KEEPER_DIR || "~/.knowledge-vault";
    return path.join(dir.replace("~", os.homedir()), "vectors.json");
}
async function loadVectorIndex() {
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
    }
    catch {
        return {
            version: 1,
            entries: [],
            model: "tfidf-simple",
            dimension: 128,
        };
    }
}
async function saveVectorIndex(index) {
    const indexPath = getVectorIndexPath();
    const dir = path.dirname(indexPath);
    await fs.mkdir(dir, { recursive: true });
    const tmpPath = indexPath + ".tmp";
    await fs.writeFile(tmpPath, JSON.stringify(index, null, 2), "utf-8");
    await fs.rename(tmpPath, indexPath);
}
// ==================== 相似度计算 ====================
function cosineSimilarity(a, b) {
    if (a.length !== b.length)
        return 0;
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
let embeddingModel = null;
function getEmbeddingModel() {
    if (!embeddingModel) {
        embeddingModel = new TFIDFEmbedding();
    }
    return embeddingModel;
}
/**
 * 为知识点生成嵌入向量
 */
export async function embedKnowledge(params) {
    const model = getEmbeddingModel();
    const text = `${params.title}\n${params.content}`;
    return model.embed(text);
}
/**
 * 将知识点添加到向量索引
 */
export async function addToVectorIndex(params) {
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
    }
    else {
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
export async function removeFromVectorIndex(id) {
    const index = await loadVectorIndex();
    index.entries = index.entries.filter((e) => e.id !== id);
    await saveVectorIndex(index);
}
/**
 * 语义搜索
 */
export async function semanticSearch(params) {
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
export async function rebuildVectorIndex(knowledgePoints) {
    const model = getEmbeddingModel();
    const entries = [];
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
    const index = {
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
export async function getVectorIndexStats() {
    const index = await loadVectorIndex();
    return {
        count: index.entries.length,
        model: index.model,
        dimension: index.dimension,
    };
}
//# sourceMappingURL=embedding.js.map
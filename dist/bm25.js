/**
 * BM25 检索模块
 * 关键词检索增强，对标 memory-lancedb-pro
 */
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
// BM25 参数
const K1 = 1.5; // 词频饱和参数
const B = 0.75; // 文档长度归一化参数
// 索引文件路径
function getBM25IndexPath() {
    const dir = process.env.KNOWLEDGE_KEEPER_DIR || "~/.knowledge-vault";
    return path.join(dir.replace("~", os.homedir()), "bm25-index.json");
}
// 简易分词器（支持中英文）
function tokenize(text) {
    // 移除标点，转小写
    const cleaned = text.toLowerCase().replace(/[^\w\s\u4e00-\u9fff]/g, " ");
    // 分词
    const tokens = [];
    // 英文单词
    const words = cleaned.split(/\s+/).filter(w => w.length > 1);
    tokens.push(...words);
    // 中文单字（简化处理）
    const chinese = cleaned.match(/[\u4e00-\u9fff]+/g) || [];
    for (const c of chinese) {
        // 每个中文字符作为单独 token
        tokens.push(...c.split(""));
    }
    return tokens;
}
// 加载索引
async function loadBM25Index() {
    const indexPath = getBM25IndexPath();
    try {
        const content = await fs.readFile(indexPath, "utf-8");
        const parsed = JSON.parse(content);
        return {
            documents: new Map(Object.entries(parsed.documents || {})),
            docCount: parsed.docCount || 0,
            avgDocLength: parsed.avgDocLength || 100,
            termFreq: new Map(Object.entries(parsed.termFreq || {})),
            termDocFreq: new Map(Object.entries(parsed.termDocFreq || {}).map(([term, docs]) => [term, new Map(Object.entries(docs))])),
            lastUpdate: parsed.lastUpdate || 0,
        };
    }
    catch {
        return {
            documents: new Map(),
            docCount: 0,
            avgDocLength: 100,
            termFreq: new Map(),
            termDocFreq: new Map(),
            lastUpdate: 0,
        };
    }
}
// 保存索引
async function saveBM25Index(index) {
    const indexPath = getBM25IndexPath();
    const dir = path.dirname(indexPath);
    await fs.mkdir(dir, { recursive: true });
    const serialized = {
        documents: Object.fromEntries(index.documents),
        docCount: index.docCount,
        avgDocLength: index.avgDocLength,
        termFreq: Object.fromEntries(index.termFreq),
        termDocFreq: Object.fromEntries(Array.from(index.termDocFreq.entries()).map(([term, docs]) => [term, Object.fromEntries(docs)])),
        lastUpdate: index.lastUpdate,
    };
    const tmpPath = indexPath + ".tmp";
    await fs.writeFile(tmpPath, JSON.stringify(serialized), "utf-8");
    await fs.rename(tmpPath, indexPath);
}
// 添加文档到索引
async function addToBM25Index(id, text) {
    const index = await loadBM25Index();
    const tokens = tokenize(text);
    const doc = {
        id,
        tokens,
        length: tokens.length,
    };
    // 移除旧文档（如果存在）
    if (index.documents.has(id)) {
        const oldDoc = index.documents.get(id);
        for (const token of oldDoc.tokens) {
            // 更新词频
            const freq = index.termFreq.get(token) || 0;
            if (freq > 0)
                index.termFreq.set(token, freq - 1);
            // 更新文档词频
            const docFreqs = index.termDocFreq.get(token);
            if (docFreqs) {
                docFreqs.delete(id);
                if (docFreqs.size === 0) {
                    index.termDocFreq.delete(token);
                }
            }
        }
        index.docCount--;
    }
    // 添加新文档
    index.documents.set(id, doc);
    index.docCount++;
    // 更新统计
    const totalLength = Array.from(index.documents.values())
        .reduce((sum, d) => sum + d.length, 0);
    index.avgDocLength = totalLength / index.docCount;
    // 更新词频
    const termCounts = new Map();
    for (const token of tokens) {
        termCounts.set(token, (termCounts.get(token) || 0) + 1);
    }
    for (const [token, freq] of termCounts) {
        // 文档频率
        const docFreq = index.termFreq.get(token) || 0;
        index.termFreq.set(token, docFreq + 1);
        // 词频映射
        if (!index.termDocFreq.has(token)) {
            index.termDocFreq.set(token, new Map());
        }
        index.termDocFreq.get(token).set(id, freq);
    }
    index.lastUpdate = Date.now();
    await saveBM25Index(index);
}
// 从索引移除文档
async function removeFromBM25Index(id) {
    const index = await loadBM25Index();
    if (!index.documents.has(id))
        return;
    const doc = index.documents.get(id);
    // 更新词频
    for (const token of doc.tokens) {
        const freq = index.termFreq.get(token) || 0;
        if (freq > 0)
            index.termFreq.set(token, freq - 1);
        const docFreqs = index.termDocFreq.get(token);
        if (docFreqs) {
            docFreqs.delete(id);
            if (docFreqs.size === 0) {
                index.termDocFreq.delete(token);
            }
        }
    }
    index.documents.delete(id);
    index.docCount--;
    // 更新平均长度
    if (index.docCount > 0) {
        const totalLength = Array.from(index.documents.values())
            .reduce((sum, d) => sum + d.length, 0);
        index.avgDocLength = totalLength / index.docCount;
    }
    index.lastUpdate = Date.now();
    await saveBM25Index(index);
}
// BM25 分数计算
function calculateBM25(queryTokens, doc, index) {
    let score = 0;
    for (const term of queryTokens) {
        // IDF 计算
        const docFreq = index.termFreq.get(term) || 0;
        if (docFreq === 0)
            continue;
        const idf = Math.log((index.docCount - docFreq + 0.5) / (docFreq + 0.5) + 1);
        // TF 计算
        const termFreqInDoc = index.termDocFreq.get(term)?.get(doc.id) || 0;
        if (termFreqInDoc === 0)
            continue;
        // BM25 公式
        const tfNorm = (termFreqInDoc * (K1 + 1)) /
            (termFreqInDoc + K1 * (1 - B + B * (doc.length / index.avgDocLength)));
        score += idf * tfNorm;
    }
    return score;
}
// BM25 搜索
async function bm25Search(query, topK = 10) {
    const index = await loadBM25Index();
    const queryTokens = tokenize(query);
    if (queryTokens.length === 0)
        return [];
    // 找到包含查询词的文档
    const candidateIds = new Set();
    for (const token of queryTokens) {
        const docFreqs = index.termDocFreq.get(token);
        if (docFreqs) {
            for (const docId of docFreqs.keys()) {
                candidateIds.add(docId);
            }
        }
    }
    // 计算每个候选文档的 BM25 分数
    const results = [];
    for (const docId of candidateIds) {
        const doc = index.documents.get(docId);
        if (doc) {
            const score = calculateBM25(queryTokens, doc, index);
            if (score > 0) {
                results.push({ id: docId, score });
            }
        }
    }
    // 排序并返回 topK
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
}
// 获取索引统计
async function getBM25Stats() {
    const index = await loadBM25Index();
    return {
        docCount: index.docCount,
        avgDocLength: Math.round(index.avgDocLength),
        termCount: index.termFreq.size,
        lastUpdate: index.lastUpdate,
    };
}
export { tokenize, addToBM25Index, removeFromBM25Index, bm25Search, getBM25Stats, K1, B, };
//# sourceMappingURL=bm25.js.map
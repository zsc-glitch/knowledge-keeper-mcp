/**
 * Semantic Search Module
 * 语义搜索模块 - 使用向量嵌入实现真正的语义搜索
 *
 * 技术方案：
 * - 嵌入模型: Xenova/all-MiniLM-L6-v2 (通过 @xenova/transformers)
 * - 向量存储: 本地 JSON 文件
 * - 相似度: 余弦相似度
 */
type Vector = number[];
/**
 * 为知识点生成嵌入向量
 */
export declare function embedKnowledge(params: {
    id: string;
    title: string;
    content: string;
}): Promise<Vector>;
/**
 * 将知识点添加到向量索引
 */
export declare function addToVectorIndex(params: {
    id: string;
    title: string;
    content: string;
}): Promise<void>;
/**
 * 从向量索引中删除
 */
export declare function removeFromVectorIndex(id: string): Promise<void>;
/**
 * 语义搜索
 */
export declare function semanticSearch(params: {
    query: string;
    topK?: number;
    threshold?: number;
}): Promise<Array<{
    id: string;
    title: string;
    contentPreview: string;
    similarity: number;
}>>;
/**
 * 重建整个向量索引
 */
export declare function rebuildVectorIndex(knowledgePoints: Array<{
    id: string;
    title: string;
    content: string;
}>): Promise<number>;
/**
 * 获取向量索引统计
 */
export declare function getVectorIndexStats(): Promise<{
    count: number;
    model: string;
    dimension: number;
}>;
export {};

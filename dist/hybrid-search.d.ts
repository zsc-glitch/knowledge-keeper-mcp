/**
 * Hybrid Search - Combines BM25 and Semantic search using Reciprocal Rank Fusion (RRF)
 *
 * RRF formula: score = Σ 1/(k + rank_i) for each search method
 * k = 60 (standard RRF constant)
 */
import { type KnowledgePoint } from "./core.js";
export declare function hybridSearch(params: {
    query: string;
    limit?: number;
    bm25Weight?: number;
    semanticWeight?: number;
}): Promise<Array<KnowledgePoint & {
    score: number;
}>>;

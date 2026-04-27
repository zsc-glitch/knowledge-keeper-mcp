/**
 * Hybrid Search - Combines BM25 and Semantic search using Reciprocal Rank Fusion (RRF)
 *
 * RRF formula: score = Σ 1/(k + rank_i) for each search method
 * k = 60 (standard RRF constant)
 */
import { getKnowledge } from "./core.js";
import { bm25Search } from "./bm25.js";
import { semanticSearch } from "./embedding.js";
const RRF_K = 60;
export async function hybridSearch(params) {
    const limit = Math.min(params.limit || 10, 50);
    const bm25Weight = params.bm25Weight ?? 0.7;
    const semanticWeight = params.semanticWeight ?? 0.3;
    // Run both searches in parallel
    const [bm25Results, semanticResults] = await Promise.all([
        bm25Search(params.query, 50).catch(() => []),
        semanticSearch({ query: params.query, topK: 50 }).catch(() => []),
    ]);
    // RRF scoring
    const scores = new Map();
    // BM25 contribution
    for (let i = 0; i < bm25Results.length; i++) {
        const { id } = bm25Results[i];
        const rrfScore = bm25Weight / (RRF_K + i + 1);
        const existing = scores.get(id);
        if (existing) {
            existing.score += rrfScore;
        }
        else {
            scores.set(id, { score: rrfScore, id });
        }
    }
    // Semantic contribution
    for (let i = 0; i < semanticResults.length; i++) {
        const { id } = semanticResults[i];
        const rrfScore = semanticWeight / (RRF_K + i + 1);
        const existing = scores.get(id);
        if (existing) {
            existing.score += rrfScore;
        }
        else {
            scores.set(id, { score: rrfScore, id });
        }
    }
    // Sort by score descending, then fetch full items
    const sorted = [...scores.values()]
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    // Fetch full knowledge points
    const results = [];
    for (const item of sorted) {
        const kp = await getKnowledge(item.id);
        if (kp) {
            results.push({ ...kp, score: item.score });
        }
    }
    return results;
}
//# sourceMappingURL=hybrid-search.js.map
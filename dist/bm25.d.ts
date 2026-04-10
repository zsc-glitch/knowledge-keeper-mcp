/**
 * BM25 检索模块
 * 关键词检索增强，对标 memory-lancedb-pro
 */
declare const K1 = 1.5;
declare const B = 0.75;
declare function tokenize(text: string): string[];
declare function addToBM25Index(id: string, text: string): Promise<void>;
declare function removeFromBM25Index(id: string): Promise<void>;
declare function bm25Search(query: string, topK?: number): Promise<Array<{
    id: string;
    score: number;
}>>;
declare function getBM25Stats(): Promise<{
    docCount: number;
    avgDocLength: number;
    termCount: number;
    lastUpdate: number;
}>;
export { tokenize, addToBM25Index, removeFromBM25Index, bm25Search, getBM25Stats, K1, B, };

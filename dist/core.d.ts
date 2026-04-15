/**
 * Knowledge Keeper Core
 * 核心逻辑，不依赖 OpenClaw SDK，可被 MCP Server 复用
 *
 * v0.5.0 新增：Obsidian vault 兼容
 */
export type KnowledgeType = "concept" | "decision" | "todo" | "note" | "project";
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
export declare class KnowledgeError extends Error {
    code: string;
    details?: Record<string, unknown> | undefined;
    constructor(message: string, code: string, details?: Record<string, unknown> | undefined);
}
export declare function getVaultDir(): string;
export declare function generateId(type: KnowledgeType): string;
export declare function saveKnowledge(params: {
    type: KnowledgeType;
    title: string;
    content: string;
    tags?: string[];
    links?: string[];
}): Promise<KnowledgePoint>;
export declare function searchKnowledge(params: {
    query: string;
    type?: KnowledgeType;
    tags?: string[];
    limit?: number;
}): Promise<KnowledgePoint[]>;
export declare function getKnowledge(id: string): Promise<KnowledgePoint | null>;
export declare function updateKnowledge(id: string, params: {
    title?: string;
    content?: string;
    tags?: string[];
    appendTags?: string[];
}): Promise<KnowledgePoint | null>;
export declare function deleteKnowledge(id: string): Promise<boolean>;
export declare function listTags(): Promise<Record<string, number>>;
export declare function reviewKnowledge(params: {
    period?: "today" | "week" | "month" | "all";
    type?: KnowledgeType;
}): Promise<{
    stats: Record<KnowledgeType, number>;
    recent: KnowledgePoint[];
}>;
export declare function semanticSearch(params: {
    query: string;
    topK?: number;
    threshold?: number;
}): Promise<Array<{
    id: string;
    title: string;
    content: string;
    type: KnowledgeType;
    tags: string[];
    similarity: number;
}>>;
export declare function getSemanticStats(): Promise<{
    count: number;
    model: string;
    dimension: number;
}>;
export declare function bm25Search(params: {
    query: string;
    topK?: number;
}): Promise<Array<{
    id: string;
    title: string;
    content: string;
    type: KnowledgeType;
    tags: string[];
    score: number;
}>>;
export declare function getBM25IndexStats(): Promise<{
    docCount: number;
    avgDocLength: number;
    termCount: number;
    lastUpdate: number;
}>;
export interface KnowledgeLink {
    from: string;
    to: string;
    relation: string;
    created: string;
}
export declare function addLink(from: string, to: string, relation: string, bidirectional?: boolean): Promise<void>;
export declare function getLinks(id: string, relation?: string, direction?: "outgoing" | "incoming" | "both"): Promise<Array<{
    id: string;
    title: string;
    relation: string;
    direction: string;
}>>;
export declare function removeLink(from: string, to?: string, relation?: string): Promise<number>;

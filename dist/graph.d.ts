/**
 * Knowledge Graph Module - Phase 1 Implementation
 * 知识图谱模块 - 实体关系管理
 *
 * Based on design: memory/knowledge-graph-design-p1-2026-04-23.md
 */
export type EntityType = "person" | "project" | "concept" | "technology" | "company" | "location" | "event" | "document";
export type RelationType = "created_by" | "related_to" | "depends_on" | "mentions" | "part_of" | "derived_from" | "collaborates" | "implements";
export interface Entity {
    id: string;
    name: string;
    type: EntityType;
    aliases: string[];
    description?: string;
    sourceIds: string[];
    created: string;
    updated: string;
}
export interface Relation {
    id: string;
    sourceId: string;
    targetId: string;
    type: RelationType;
    weight: number;
    evidence: string[];
    created: string;
}
export interface KnowledgeGraphIndex {
    entities: Entity[];
    relations: Relation[];
    entityNameIndex: Record<string, string[]>;
    lastUpdate: number;
}
export declare function detectEntities(text: string): {
    name: string;
    type: EntityType;
}[];
export declare function generateEntityId(type: EntityType): string;
export declare function generateRelationId(): string;
export declare function loadGraph(): Promise<KnowledgeGraphIndex>;
export declare function saveGraph(graph: KnowledgeGraphIndex): Promise<void>;
export declare function addEntity(entity: Omit<Entity, "id" | "created" | "updated">): Promise<Entity>;
export declare function addRelation(relation: Omit<Relation, "id" | "created">): Promise<Relation>;
export declare function queryEntity(idOrName: string): Promise<Entity | null>;
export declare function queryRelations(entityId: string): Promise<Relation[]>;
export declare function getNeighbors(entityId: string): Promise<Entity[]>;
export declare function exportMermaid(entityIds?: string[], maxDepth?: number): Promise<string>;
export declare function getGraphStats(): Promise<{
    entityCount: number;
    relationCount: number;
    entityTypeCounts: Record<EntityType, number>;
    coverage: number;
}>;
declare const _default: {
    detectEntities: typeof detectEntities;
    addEntity: typeof addEntity;
    addRelation: typeof addRelation;
    queryEntity: typeof queryEntity;
    queryRelations: typeof queryRelations;
    getNeighbors: typeof getNeighbors;
    exportMermaid: typeof exportMermaid;
    getGraphStats: typeof getGraphStats;
    loadGraph: typeof loadGraph;
    saveGraph: typeof saveGraph;
};
export default _default;

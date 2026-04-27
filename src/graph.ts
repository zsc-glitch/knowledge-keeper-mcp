/**
 * Knowledge Graph Module - Phase 1 Implementation
 * 知识图谱模块 - 实体关系管理
 *
 * Based on design: memory/knowledge-graph-design-p1-2026-04-23.md
 */

import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";

// ==================== Types ====================

export type EntityType =
  | "person"
  | "project"
  | "concept"
  | "technology"
  | "company"
  | "location"
  | "event"
  | "document";

export type RelationType =
  | "created_by"
  | "related_to"
  | "depends_on"
  | "mentions"
  | "part_of"
  | "derived_from"
  | "collaborates"
  | "implements";

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
  entityNameIndex: Record<string, string[]>;  // name -> entityIds
  lastUpdate: number;
}

// ==================== Storage ====================

function getGraphDir(): string {
  const dir = process.env.KNOWLEDGE_KEEPER_DIR || "~/.knowledge-vault";
  return path.join(dir.replace("~", os.homedir()), "graph");
}

async function ensureGraphDir(): Promise<void> {
  const dir = getGraphDir();
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "EEXIST") {
      throw err;
    }
  }
}

// ==================== Entity Detection (Phase 1 - Simplified) ====================

const ENTITY_PATTERNS: Record<EntityType, RegExp[]> = {
  person: [
    /(?:created by|author|developer|by)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
    /(?:mentioned|said|according to)\s+([A-Z][a-z]+)/gi,
  ],
  project: [
    /(?:project|repo|repository)\s+([a-z0-9-]+)/gi,
    /github\.com\/[\w]+\/([\w-]+)/gi,
  ],
  technology: [
    /\b(React|TypeScript|Rust|Python|Claude|OpenAI|Gemini|GPT|LLM|MCP)\b/gi,
  ],
  company: [
    /\b(NousResearch|Anthropic|OpenAI|Google|Meta|Microsoft|GitHub)\b/gi,
  ],
  concept: [
    /\b(agent|memory|knowledge graph|audit|compliance|MCP)\b/gi,
  ],
  location: [],
  event: [],
  document: [],
};

export function detectEntities(text: string): { name: string; type: EntityType }[] {
  const entities: { name: string; type: EntityType }[] = [];

  for (const [type, patterns] of Object.entries(ENTITY_PATTERNS) as [EntityType, RegExp[]][]) {
    for (const pattern of patterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const name = match[1] || match[0];
        if (name && name.length > 1) {
          entities.push({ name: name.trim(), type });
        }
      }
    }
  }

  // Deduplicate
  const unique = new Map<string, { name: string; type: EntityType }>();
  for (const e of entities) {
    const key = `${e.type}:${e.name.toLowerCase()}`;
    if (!unique.has(key)) {
      unique.set(key, e);
    }
  }

  return Array.from(unique.values());
}

// ==================== ID Generation ====================

export function generateEntityId(type: EntityType): string {
  const prefix: Record<EntityType, string> = {
    person: "ent-ps",
    project: "ent-pr",
    concept: "ent-cp",
    technology: "ent-tc",
    company: "ent-cm",
    location: "ent-lc",
    event: "ent-ev",
    document: "ent-dc",
  };
  const timestamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix[type]}-${timestamp}-${rand}`;
}

export function generateRelationId(): string {
  const timestamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `rel-${timestamp}-${rand}`;
}

// ==================== Graph Operations ====================

export async function loadGraph(): Promise<KnowledgeGraphIndex> {
  const graphPath = path.join(getGraphDir(), "index.json");
  try {
    const content = await fs.readFile(graphPath, "utf-8");
    return JSON.parse(content);
  } catch {
    return {
      entities: [],
      relations: [],
      entityNameIndex: {},
      lastUpdate: Date.now(),
    };
  }
}

export async function saveGraph(graph: KnowledgeGraphIndex): Promise<void> {
  await ensureGraphDir();
  const graphPath = path.join(getGraphDir(), "index.json");
  graph.lastUpdate = Date.now();

  // Atomic write
  const tmpPath = `${graphPath}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(graph, null, 2));
  await fs.rename(tmpPath, graphPath);
}

export async function addEntity(
  entity: Omit<Entity, "id" | "created" | "updated">
): Promise<Entity> {
  const graph = await loadGraph();

  // Check if entity exists
  const existing = graph.entities.find(
    e => e.name.toLowerCase() === entity.name.toLowerCase() && e.type === entity.type
  );

  if (existing) {
    // Update existing
    existing.sourceIds.push(...entity.sourceIds);
    existing.updated = new Date().toISOString();
    await saveGraph(graph);
    return existing;
  }

  // Create new
  const newEntity: Entity = {
    ...entity,
    id: generateEntityId(entity.type),
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  };

  graph.entities.push(newEntity);

  // Update name index
  const key = entity.name.toLowerCase();
  if (!graph.entityNameIndex[key]) {
    graph.entityNameIndex[key] = [];
  }
  graph.entityNameIndex[key].push(newEntity.id);

  await saveGraph(graph);
  return newEntity;
}

export async function addRelation(
  relation: Omit<Relation, "id" | "created">
): Promise<Relation> {
  const graph = await loadGraph();

  const newRelation: Relation = {
    ...relation,
    id: generateRelationId(),
    created: new Date().toISOString(),
  };

  graph.relations.push(newRelation);
  await saveGraph(graph);
  return newRelation;
}

export async function queryEntity(idOrName: string): Promise<Entity | null> {
  const graph = await loadGraph();

  // Try by ID
  const byId = graph.entities.find(e => e.id === idOrName);
  if (byId) return byId;

  // Try by name
  const ids = graph.entityNameIndex[idOrName.toLowerCase()];
  if (ids && ids.length > 0) {
    return graph.entities.find(e => e.id === ids[0]) || null;
  }

  return null;
}

export async function queryRelations(entityId: string): Promise<Relation[]> {
  const graph = await loadGraph();
  return graph.relations.filter(
    r => r.sourceId === entityId || r.targetId === entityId
  );
}

export async function getNeighbors(entityId: string): Promise<Entity[]> {
  const graph = await loadGraph();
  const relations = await queryRelations(entityId);

  const neighborIds = new Set<string>();
  for (const r of relations) {
    if (r.sourceId === entityId) neighborIds.add(r.targetId);
    if (r.targetId === entityId) neighborIds.add(r.sourceId);
  }

  return graph.entities.filter(e => neighborIds.has(e.id));
}

// ==================== Visualization ====================

export async function exportMermaid(
  entityIds?: string[],
  maxDepth?: number
): Promise<string> {
  const graph = await loadGraph();

  let entities = graph.entities;
  let relations = graph.relations;

  if (entityIds && entityIds.length > 0) {
    entities = entities.filter(e => entityIds.includes(e.id));
    relations = relations.filter(
      r => entityIds.includes(r.sourceId) || entityIds.includes(r.targetId)
    );
  }

  const lines: string[] = ["graph TD"];

  // Add entities
  for (const e of entities) {
    const label = e.name.replace(/"/g, "'");
    lines.push(`  ${e.id}["${label} (${e.type})"]`);
  }

  // Add relations
  for (const r of relations) {
    const arrow = getRelationArrow(r.type);
    lines.push(`  ${r.sourceId} ${arrow} ${r.targetId}`);
  }

  return lines.join("\n");
}

function getRelationArrow(type: RelationType): string {
  const arrows: Record<RelationType, string> = {
    created_by: "-->",
    related_to: "---",
    depends_on: "-->",
    mentions: "-.-",
    part_of: "-->",
    derived_from: "-->",
    collaborates: "<-->",
    implements: "-->",
  };
  return arrows[type] || "---";
}

// ==================== Stats ====================

export async function getGraphStats(): Promise<{
  entityCount: number;
  relationCount: number;
  entityTypeCounts: Record<EntityType, number>;
  coverage: number;
}> {
  const graph = await loadGraph();

  const entityTypeCounts: Record<EntityType, number> = {
    person: 0,
    project: 0,
    concept: 0,
    technology: 0,
    company: 0,
    location: 0,
    event: 0,
    document: 0,
  };

  for (const e of graph.entities) {
    entityTypeCounts[e.type]++;
  }

  return {
    entityCount: graph.entities.length,
    relationCount: graph.relations.length,
    entityTypeCounts,
    coverage: 0, // TODO: calculate based on knowledge points
  };
}

// ==================== Export ====================

export default {
  detectEntities,
  addEntity,
  addRelation,
  queryEntity,
  queryRelations,
  getNeighbors,
  exportMermaid,
  getGraphStats,
  loadGraph,
  saveGraph,
};
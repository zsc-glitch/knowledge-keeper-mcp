/**
 * Version History for Knowledge Keeper
 * Stores previous versions of knowledge points for diff and rollback
 * 
 * Storage: .versions/ directory in vault, one JSON file per knowledge item
 */

import * as fs from "fs/promises";
import * as path from "path";
import { getVaultDir, type KnowledgePoint } from "./core.js";

// ============================================================
// Types
// ============================================================

export interface VersionEntry {
  version: number;
  timestamp: string;
  title: string;
  content: string;
  tags: string[];
  source: string;
}

export interface VersionHistory {
  id: string;
  currentVersion: number;
  versions: VersionEntry[];
}

// ============================================================
// Internal
// ============================================================

function getVersionsDir(vaultDir: string): string {
  return path.join(vaultDir, ".versions");
}

async function ensureVersionsDir(vaultDir: string): Promise<string> {
  const dir = getVersionsDir(vaultDir);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

async function loadVersionHistory(vaultDir: string, id: string): Promise<VersionHistory> {
  const dir = getVersionsDir(vaultDir);
  const filepath = path.join(dir, `${id}.json`);
  try {
    const content = await fs.readFile(filepath, "utf-8");
    return JSON.parse(content);
  } catch {
    return { id, currentVersion: 0, versions: [] };
  }
}

async function saveVersionHistory(vaultDir: string, history: VersionHistory): Promise<void> {
  const dir = await ensureVersionsDir(vaultDir);
  const filepath = path.join(dir, `${history.id}.json`);
  const tmpPath = path.join(dir, `${history.id}.json.tmp`);
  await fs.writeFile(tmpPath, JSON.stringify(history, null, 2), "utf-8");
  await fs.rename(tmpPath, filepath);
}

// ============================================================
// Public API
// ============================================================

/**
 * Record a version snapshot before updating a knowledge point
 * Call this BEFORE the update is applied
 */
export async function recordVersion(kp: KnowledgePoint): Promise<void> {
  const vaultDir = getVaultDir();
  const history = await loadVersionHistory(vaultDir, kp.id);

  const entry: VersionEntry = {
    version: history.currentVersion + 1,
    timestamp: new Date().toISOString(),
    title: kp.title,
    content: kp.content,
    tags: [...kp.tags],
    source: kp.source,
  };

  history.versions.push(entry);
  history.currentVersion = entry.version;

  await saveVersionHistory(vaultDir, history);
}

/**
 * Get the version history for a knowledge point
 */
export async function getVersionHistory(id: string): Promise<VersionHistory | null> {
  const vaultDir = getVaultDir();
  const history = await loadVersionHistory(vaultDir, id);

  if (history.versions.length === 0) {
    return null;
  }

  return history;
}

/**
 * Get a specific version of a knowledge point
 */
export async function getVersion(id: string, version: number): Promise<VersionEntry | null> {
  const vaultDir = getVaultDir();
  const history = await loadVersionHistory(vaultDir, id);
  return history.versions.find(v => v.version === version) || null;
}

/**
 * Diff two versions of a knowledge point
 */
export async function diffVersions(
  id: string,
  versionA: number,
  versionB: number
): Promise<{ field: string; old: string; new: string }[] | null> {
  const vaultDir = getVaultDir();
  const history = await loadVersionHistory(vaultDir, id);

  const a = history.versions.find(v => v.version === versionA);
  const b = history.versions.find(v => v.version === versionB);

  if (!a || !b) return null;

  const diffs: { field: string; old: string; new: string }[] = [];

  if (a.title !== b.title) {
    diffs.push({ field: "title", old: a.title, new: b.title });
  }
  if (a.content !== b.content) {
    diffs.push({ field: "content", old: a.content, new: b.content });
  }
  if (JSON.stringify(a.tags.sort()) !== JSON.stringify(b.tags.sort())) {
    diffs.push({ field: "tags", old: a.tags.join(", "), new: b.tags.join(", ") });
  }

  return diffs;
}

/**
 * Rollback a knowledge point to a specific version
 * Returns the KnowledgePoint data from that version
 */
export async function rollbackToVersion(
  id: string,
  targetVersion: number
): Promise<{ title: string; content: string; tags: string[] } | null> {
  const vaultDir = getVaultDir();
  const history = await loadVersionHistory(vaultDir, id);

  const target = history.versions.find(v => v.version === targetVersion);
  if (!target) return null;

  return {
    title: target.title,
    content: target.content,
    tags: [...target.tags],
  };
}

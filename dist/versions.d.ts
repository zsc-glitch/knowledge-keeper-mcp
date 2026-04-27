/**
 * Version History for Knowledge Keeper
 * Stores previous versions of knowledge points for diff and rollback
 *
 * Storage: .versions/ directory in vault, one JSON file per knowledge item
 */
import { type KnowledgePoint } from "./core.js";
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
/**
 * Record a version snapshot before updating a knowledge point
 * Call this BEFORE the update is applied
 */
export declare function recordVersion(kp: KnowledgePoint): Promise<void>;
/**
 * Get the version history for a knowledge point
 */
export declare function getVersionHistory(id: string): Promise<VersionHistory | null>;
/**
 * Get a specific version of a knowledge point
 */
export declare function getVersion(id: string, version: number): Promise<VersionEntry | null>;
/**
 * Diff two versions of a knowledge point
 */
export declare function diffVersions(id: string, versionA: number, versionB: number): Promise<{
    field: string;
    old: string;
    new: string;
}[] | null>;
/**
 * Rollback a knowledge point to a specific version
 * Returns the KnowledgePoint data from that version
 */
export declare function rollbackToVersion(id: string, targetVersion: number): Promise<{
    title: string;
    content: string;
    tags: string[];
} | null>;

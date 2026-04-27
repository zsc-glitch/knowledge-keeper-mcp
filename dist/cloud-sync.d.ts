/**
 * Cloud Sync Module (Pro Feature)
 * End-to-end encrypted sync for Knowledge Keeper
 *
 * Architecture:
 * - Local data encrypted with user's key before upload
 * - Server never sees plaintext
 * - Conflict resolution via vector clocks
 * - Incremental sync (only changed items)
 */
import { type KnowledgePoint } from "./core.js";
export interface SyncConfig {
    /** API endpoint for the sync server */
    serverUrl: string;
    /** User API key (from payment/registration) */
    apiKey: string;
    /** Local encryption key (derived from user passphrase) */
    encryptionKey: string;
    /** Sync interval in milliseconds (default: 5 min) */
    syncInterval?: number;
    /** Local vault path */
    vaultPath: string;
}
export interface SyncStatus {
    lastSyncAt: string | null;
    pendingChanges: number;
    syncedItems: number;
    conflicts: number;
    status: "idle" | "syncing" | "error" | "unconfigured";
    error?: string;
}
interface EncryptedPayload {
    /** Encrypted data (base64) */
    data: string;
    /** IV (base64) */
    iv: string;
    /** Auth tag (base64) */
    tag: string;
    /** Schema version */
    version: number;
}
export declare function encrypt(data: string, passphrase: string): EncryptedPayload;
export declare function decrypt(payload: EncryptedPayload, passphrase: string): string;
export declare function hashEntry(entry: KnowledgePoint): string;
/**
 * Push local changes to the cloud
 */
export declare function pushChanges(config: SyncConfig): Promise<{
    pushed: number;
    conflicts: number;
    error?: string;
}>;
/**
 * Pull changes from the cloud
 */
export declare function pullChanges(config: SyncConfig): Promise<{
    pulled: number;
    conflicts: number;
    error?: string;
}>;
/**
 * Full sync: pull then push
 */
export declare function fullSync(config: SyncConfig): Promise<{
    pushed: number;
    pulled: number;
    conflicts: number;
    error?: string;
}>;
/**
 * Get current sync status
 */
export declare function getSyncStatus(vaultPath: string): Promise<SyncStatus>;
export interface LicenseInfo {
    tier: "free" | "pro" | "team";
    expiresAt: string | null;
    features: string[];
}
/**
 * Validate API key against the license server
 */
export declare function validateLicense(apiKey: string): Promise<LicenseInfo>;
export {};

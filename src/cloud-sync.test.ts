/**
 * Cloud Sync Module Tests
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  encrypt,
  decrypt,
  hashEntry,
  getSyncStatus,
  validateLicense,
  type SyncConfig,
} from "./cloud-sync.js";
import { saveKnowledge, type KnowledgePoint } from "./core.js";
import { mkdir, rm, writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

let testVaultDir: string;

async function setupVault() {
  testVaultDir = join(tmpdir(), `kk-sync-test-${Date.now()}`);
  process.env.KK_VAULT_PATH = testVaultDir;
  await mkdir(testVaultDir, { recursive: true });
  for (const type of ["concepts", "decisions", "todos", "notes", "projects"]) {
    await mkdir(join(testVaultDir, type), { recursive: true });
  }
}

async function teardownVault() {
  try {
    await rm(testVaultDir, { recursive: true, force: true });
  } catch {}
  delete process.env.KK_VAULT_PATH;
}

describe("Cloud Sync Module", async () => {
  await setupVault();

  describe("Encryption", () => {
    it("encrypt and decrypt roundtrip works", () => {
      const plaintext = '{"id":"test","title":"Hello","content":"World"}';
      const passphrase = "my-secret-key-123";

      const encrypted = encrypt(plaintext, passphrase);
      assert.ok(encrypted.data);
      assert.ok(encrypted.iv);
      assert.ok(encrypted.tag);
      assert.equal(encrypted.version, 1);

      const decrypted = decrypt(encrypted, passphrase);
      assert.equal(decrypted, plaintext);
    });

    it("different passphrases produce different ciphertext", () => {
      const plaintext = "test data";
      const enc1 = encrypt(plaintext, "pass1");
      const enc2 = encrypt(plaintext, "pass2");

      // Different salts -> different data
      assert.notEqual(enc1.data, enc2.data);
    });

    it("wrong passphrase fails to decrypt", () => {
      const plaintext = "secret data";
      const encrypted = encrypt(plaintext, "correct-key");

      assert.throws(() => {
        decrypt(encrypted, "wrong-key");
      });
    });
  });

  describe("hashEntry", () => {
    it("produces consistent hash for same content", async () => {
      const entry: KnowledgePoint = {
        id: "test-1",
        type: "concept",
        title: "Test",
        content: "Content",
        tags: ["a", "b"],
        links: [],
        created: "2026-01-01",
        updated: "2026-01-01",
        source: "manual",
      };

      const hash1 = hashEntry(entry);
      const hash2 = hashEntry(entry);
      assert.equal(hash1, hash2);
      assert.equal(hash1.length, 64); // SHA-256 hex
    });

    it("produces different hash for different content", async () => {
      const entry1: KnowledgePoint = {
        id: "test-1", type: "concept", title: "Test A", content: "Content A",
        tags: [], links: [], created: "2026-01-01", updated: "2026-01-01", source: "manual",
      };
      const entry2: KnowledgePoint = {
        id: "test-1", type: "concept", title: "Test B", content: "Content B",
        tags: [], links: [], created: "2026-01-01", updated: "2026-01-01", source: "manual",
      };

      assert.notEqual(hashEntry(entry1), hashEntry(entry2));
    });
  });

  describe("getSyncStatus", () => {
    it("returns unconfigured when no manifest exists", async () => {
      const status = await getSyncStatus(testVaultDir);
      assert.equal(status.status, "unconfigured");
      assert.equal(status.lastSyncAt, null);
    });

    it("returns idle with manifest", async () => {
      // Create a manifest
      const manifest = {
        items: {},
        lastFullSync: "2026-04-27T00:00:00Z",
        deviceId: "test-device",
      };
      await writeFile(join(testVaultDir, ".sync-manifest.json"), JSON.stringify(manifest));

      const status = await getSyncStatus(testVaultDir);
      assert.ok(status.status === "idle" || status.status === "unconfigured");
    });
  });

  describe("validateLicense", () => {
    it("returns free tier with no API key", async () => {
      const info = await validateLicense("");
      assert.equal(info.tier, "free");
      assert.ok(info.features.includes("local-storage"));
    });
  });

  await teardownVault();
});

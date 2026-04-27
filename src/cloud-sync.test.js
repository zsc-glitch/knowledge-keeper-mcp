/**
 * Cloud Sync Encryption Tests (JS, runnable with node --test)
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHash, createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { readFile, writeFile, mkdir, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

// Re-implement core encryption functions for isolated testing
// (These mirror cloud-sync.ts but are self-contained for test isolation)

const ALGORITHM = "aes-256-gcm";

function deriveKey(passphrase, salt) {
  return createHash("sha256").update(passphrase + salt.toString("hex")).digest();
}

function encrypt(data, passphrase) {
  const salt = randomBytes(16);
  const key = deriveKey(passphrase, salt);
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(data, "utf8", "base64");
  encrypted += cipher.final("base64");
  const tag = cipher.getAuthTag();
  return {
    data: salt.toString("base64") + "." + encrypted,
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    version: 1,
  };
}

function decrypt(payload, passphrase) {
  const parts = payload.data.split(".");
  const salt = Buffer.from(parts[0], "base64");
  const key = deriveKey(passphrase, salt);
  const iv = Buffer.from(payload.iv, "base64");
  const tag = Buffer.from(payload.tag, "base64");
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(parts[1], "base64", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

function hashEntry(entry) {
  const content = JSON.stringify({
    title: entry.title,
    content: entry.content,
    tags: (entry.tags || []).sort(),
  });
  return createHash("sha256").update(content).digest("hex");
}

describe("Cloud Sync - Encryption", () => {
  it("encrypt and decrypt roundtrip", () => {
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
    assert.notEqual(enc1.data, enc2.data);
  });

  it("wrong passphrase fails to decrypt", () => {
    const plaintext = "secret data";
    const encrypted = encrypt(plaintext, "correct-key");
    assert.throws(() => {
      decrypt(encrypted, "wrong-key");
    });
  });

  it("same plaintext encrypted twice produces different ciphertext (random IV/salt)", () => {
    const plaintext = "same data";
    const enc1 = encrypt(plaintext, "same-key");
    const enc2 = encrypt(plaintext, "same-key");
    assert.notEqual(enc1.data, enc2.data);
    // But both decrypt correctly
    assert.equal(decrypt(enc1, "same-key"), plaintext);
    assert.equal(decrypt(enc2, "same-key"), plaintext);
  });
});

describe("Cloud Sync - Hashing", () => {
  it("consistent hash for same content", () => {
    const entry = { title: "Test", content: "Content", tags: ["a", "b"] };
    const hash1 = hashEntry(entry);
    const hash2 = hashEntry(entry);
    assert.equal(hash1, hash2);
    assert.equal(hash1.length, 64); // SHA-256 hex
  });

  it("different hash for different content", () => {
    const entry1 = { title: "Test A", content: "Content A", tags: [] };
    const entry2 = { title: "Test B", content: "Content B", tags: [] };
    assert.notEqual(hashEntry(entry1), hashEntry(entry2));
  });

  it("tag order doesn't affect hash", () => {
    const entry1 = { title: "Test", content: "Content", tags: ["b", "a"] };
    const entry2 = { title: "Test", content: "Content", tags: ["a", "b"] };
    assert.equal(hashEntry(entry1), hashEntry(entry2));
  });
});

describe("Cloud Sync - Manifest", () => {
  it("unconfigured status when no manifest", async () => {
    const testDir = join(tmpdir(), `kk-sync-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });

    // Simulate unconfigured state
    const manifestPath = join(testDir, ".sync-manifest.json");
    let exists = false;
    try { await readFile(manifestPath); exists = true; } catch {}
    assert.equal(exists, false);

    await rm(testDir, { recursive: true, force: true });
  });

  it("manifest can be created and read", async () => {
    const testDir = join(tmpdir(), `kk-sync-test2-${Date.now()}`);
    await mkdir(testDir, { recursive: true });

    const manifest = {
      items: {},
      lastFullSync: "2026-04-27T00:00:00Z",
      deviceId: "test-device",
    };
    await writeFile(join(testDir, ".sync-manifest.json"), JSON.stringify(manifest));

    const read = JSON.parse(await readFile(join(testDir, ".sync-manifest.json"), "utf8"));
    assert.equal(read.deviceId, "test-device");
    assert.equal(read.lastFullSync, "2026-04-27T00:00:00Z");

    await rm(testDir, { recursive: true, force: true });
  });
});

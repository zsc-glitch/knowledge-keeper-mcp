/**
 * Core Module Tests (Node built-in)
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import * as path from "path";
import * as os from "os";

// Import compiled module
const { generateId, getVaultDir, KnowledgeError } = await import("../dist/core.js");

describe("generateId", () => {
  it("should generate unique IDs for each type", () => {
    const types = ["concept", "decision", "todo", "note", "project"];
    const ids = new Set();
    types.forEach((type) => {
      const id = generateId(type);
      assert.ok(id.startsWith("kp-"));
      ids.add(id);
    });
    assert.strictEqual(ids.size, 5);
  });

  it("should generate 100 unique IDs", () => {
    const ids = new Set();
    for (let i = 0; i < 100; i++) {
      ids.add(generateId("concept"));
    }
    assert.strictEqual(ids.size, 100);
  });
});

describe("getVaultDir", () => {
  const originalEnv = process.env.KNOWLEDGE_KEEPER_DIR;

  it("should return default vault directory", () => {
    delete process.env.KNOWLEDGE_KEEPER_DIR;
    const dir = getVaultDir();
    assert.strictEqual(dir, path.join(os.homedir(), ".knowledge-vault"));
  });

  it("should expand ~ to home directory", () => {
    process.env.KNOWLEDGE_KEEPER_DIR = "~/my-vault";
    const dir = getVaultDir();
    assert.strictEqual(dir, path.join(os.homedir(), "my-vault"));
  });

  // Restore env
  if (originalEnv) process.env.KNOWLEDGE_KEEPER_DIR = originalEnv;
  else delete process.env.KNOWLEDGE_KEEPER_DIR;
});

describe("KnowledgeError", () => {
  it("should create error with code", () => {
    const error = new KnowledgeError("Test error", "TEST_CODE");
    assert.strictEqual(error.message, "Test error");
    assert.strictEqual(error.code, "TEST_CODE");
    assert.strictEqual(error.name, "KnowledgeError");
  });
});
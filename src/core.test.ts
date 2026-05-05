/**
 * Core Module Tests
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import {
  getVaultDir,
  generateId,
  KnowledgeType,
  KnowledgeError,
} from "./core.js";

describe("generateId", () => {
  it("should generate unique IDs for each type", () => {
    const types: KnowledgeType[] = ["concept", "decision", "todo", "note", "project"];
    const prefixMap: Record<KnowledgeType, string> = {
      concept: "kp-cp",
      decision: "kp-dc",
      todo: "kp-td",
      note: "kp-nt",
      project: "kp-pj",
    };
    const ids = new Set<string>();

    types.forEach((type) => {
      const id = generateId(type);
      expect(id).toMatch(new RegExp(`^${prefixMap[type]}-`));
      ids.add(id);
    });

    expect(ids.size).toBe(5);
  });

  it("should generate unique IDs on multiple calls", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateId("concept"));
    }
    expect(ids.size).toBe(100);
  });
});

describe("getVaultDir", () => {
  const originalEnv = process.env.KNOWLEDGE_KEEPER_DIR;

  afterEach(() => {
    if (originalEnv) {
      process.env.KNOWLEDGE_KEEPER_DIR = originalEnv;
    } else {
      delete process.env.KNOWLEDGE_KEEPER_DIR;
    }
  });

  it("should return default vault directory", () => {
    delete process.env.KNOWLEDGE_KEEPER_DIR;
    const dir = getVaultDir();
    expect(dir).toBe(path.join(os.homedir(), ".knowledge-vault"));
  });

  it("should use custom directory from env", () => {
    process.env.KNOWLEDGE_KEEPER_DIR = "/custom/vault";
    const dir = getVaultDir();
    expect(dir).toBe("/custom/vault");
  });

  it("should expand ~ to home directory", () => {
    process.env.KNOWLEDGE_KEEPER_DIR = "~/my-vault";
    const dir = getVaultDir();
    expect(dir).toBe(path.join(os.homedir(), "my-vault"));
  });
});

describe("KnowledgeError", () => {
  it("should create error with code", () => {
    const error = new KnowledgeError("Test error", "TEST_CODE");
    expect(error.message).toBe("Test error");
    expect(error.code).toBe("TEST_CODE");
    expect(error.name).toBe("KnowledgeError");
  });

  it("should create error with details", () => {
    const details = { key: "value", count: 42 };
    const error = new KnowledgeError("Test error", "TEST_CODE", details);
    expect(error.details).toEqual(details);
  });
});
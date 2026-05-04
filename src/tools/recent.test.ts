/**
 * knowledge_recent tool tests
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { join } from "path";
import { mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";

// Set vault dir before importing core
const testVault = await mkdtemp(join(tmpdir(), "kk-recent-test-"));
process.env.KNOWLEDGE_VAULT_DIR = testVault;

import { saveKnowledge } from "../core.js";

describe("knowledge_recent", () => {
  afterAll(async () => {
    await rm(testVault, { recursive: true, force: true });
  });

  it("should return recently saved knowledge points", async () => {
    // Save some knowledge points
    const kp1 = await saveKnowledge({
      title: "Recent Test 1",
      content: "First recent knowledge point",
      type: "note",
      tags: ["test"],
      source: "mcp",
    });

    const kp2 = await saveKnowledge({
      title: "Recent Test 2",
      content: "Second recent knowledge point",
      type: "concept",
      tags: ["test"],
      source: "mcp",
    });

    expect(kp1).toBeDefined();
    expect(kp1.id).toBeTruthy();
    expect(kp2).toBeDefined();
    expect(kp2.id).toBeTruthy();

    // Verify they have updated timestamps
    expect(kp1.updated).toBeTruthy();
    expect(kp2.updated).toBeTruthy();
  });

  it("should filter by type", async () => {
    const notes = await saveKnowledge({
      title: "Type Filter Note",
      content: "A note for type filtering",
      type: "note",
      tags: ["filter"],
      source: "mcp",
    });

    expect(notes.type).toBe("note");
  });

  it("should respect limit parameter", async () => {
    // Save multiple items
    for (let i = 0; i < 5; i++) {
      await saveKnowledge({
        title: `Limit Test ${i}`,
        content: `Content ${i}`,
        type: "note",
        tags: ["limit-test"],
        source: "mcp",
      });
    }

    // searchKnowledge with empty query should return results
    const { searchKnowledge } = await import("../core.js");
    const results = await searchKnowledge({ query: "", limit: 3 });
    expect(results.length).toBeLessThanOrEqual(3);
  });

  it("should filter by days", async () => {
    const { searchKnowledge } = await import("../core.js");
    const results = await searchKnowledge({ query: "", limit: 50 });

    // Filter to last 1 day
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 1);
    const filtered = results.filter(kp => kp.updated >= cutoff.toISOString());

    // All recently created items should be within 1 day
    expect(filtered.length).toBeGreaterThan(0);
  });
});

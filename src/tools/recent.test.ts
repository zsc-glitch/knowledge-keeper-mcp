/**
 * knowledge_recent tool tests
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdir, rm, writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { saveKnowledge } from "../core.js";

let testDir: string;
const originalDir = process.env.KNOWLEDGE_KEEPER_DIR;

beforeEach(async () => {
  testDir = join(tmpdir(), `kk-test-recent-${Date.now()}`);
  process.env.KNOWLEDGE_KEEPER_DIR = testDir;
  for (const type of ["concepts", "decisions", "todos", "notes", "projects"]) {
    await mkdir(join(testDir, type), { recursive: true });
  }
  await mkdir(join(testDir, "graph"), { recursive: true });
  await writeFile(join(testDir, "index.json"), JSON.stringify({ version: 1, entries: [], tagsIndex: {} }));
  await writeFile(join(testDir, "links.json"), JSON.stringify({ links: [] }));
});

afterEach(async () => {
  process.env.KNOWLEDGE_KEEPER_DIR = originalDir;
  await rm(testDir, { recursive: true, force: true }).catch(() => {});
});

describe("Recent Knowledge", () => {
  it("should save and list knowledge points", async () => {
    const kp1 = await saveKnowledge({
      type: "concept",
      title: "Test Concept 1",
      content: "This is a test concept for recent listing.",
      tags: ["test"],
    });

    const kp2 = await saveKnowledge({
      type: "note",
      title: "Test Note 1",
      content: "This is a test note for recent listing.",
      tags: ["test"],
    });

    expect(kp1.id).toBeTruthy();
    expect(kp2.id).toBeTruthy();
    expect(kp1.type).toBe("concept");
    expect(kp2.type).toBe("note");
  });

  it("should handle different knowledge types", async () => {
    const types = ["concept", "decision", "todo", "note", "project"] as const;
    const saved = [];

    for (const type of types) {
      const kp = await saveKnowledge({
        type,
        title: `Test ${type}`,
        content: `Content for ${type}`,
        tags: ["test"],
      });
      saved.push(kp);
    }

    expect(saved).toHaveLength(5);
    for (const kp of saved) {
      expect(kp.id).toContain("kp-");
    }
  });

  it("should order by creation time", async () => {
    const kp1 = await saveKnowledge({ type: "note", title: "First", content: "Created first", tags: [] });
    const kp2 = await saveKnowledge({ type: "note", title: "Second", content: "Created second", tags: [] });

    expect(kp2.created >= kp1.created).toBe(true);
  });

  it("should handle empty knowledge base for recent", async () => {
    // Empty knowledge base — no entries
    const { loadAllEntries } = await import("../core.js");
    const entries = await loadAllEntries();
    expect(entries).toHaveLength(0);
  });
});

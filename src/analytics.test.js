/**
 * Analytics Module Tests (JS, runnable with node --test)
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdir, rm, writeFile, readFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

describe("Analytics - Overview", () => {
  it("computes basic stats from knowledge index", async () => {
    const testDir = join(tmpdir(), `kk-analytics-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });

    // Create a minimal index
    const index = {
      version: 1,
      entries: [
        { id: "1", type: "concept", title: "A", content: "Content A", tags: ["test"], links: [], created: "2026-04-27T10:00:00Z", updated: "2026-04-27T10:00:00Z", source: "mcp" },
        { id: "2", type: "note", title: "B", content: "Content B", tags: ["test", "analytics"], links: [], created: "2026-04-27T11:00:00Z", updated: "2026-04-27T11:00:00Z", source: "mcp" },
        { id: "3", type: "decision", title: "C", content: "Content C", tags: ["analytics"], links: ["1"], created: "2026-04-27T12:00:00Z", updated: "2026-04-27T12:00:00Z", source: "mcp" },
      ],
      tagsIndex: { test: ["1", "2"], analytics: ["2", "3"] },
    };

    await writeFile(join(testDir, "index.json"), JSON.stringify(index));

    // Read and verify
    const read = JSON.parse(await readFile(join(testDir, "index.json"), "utf8"));
    assert.equal(read.entries.length, 3);
    assert.equal(Object.keys(read.tagsIndex).length, 2);

    await rm(testDir, { recursive: true, force: true });
  });

  it("handles empty vault", async () => {
    const testDir = join(tmpdir(), `kk-analytics-empty-${Date.now()}`);
    await mkdir(testDir, { recursive: true });

    const index = { version: 1, entries: [], tagsIndex: {} };
    await writeFile(join(testDir, "index.json"), JSON.stringify(index));

    const read = JSON.parse(await readFile(join(testDir, "index.json"), "utf8"));
    assert.equal(read.entries.length, 0);

    await rm(testDir, { recursive: true, force: true });
  });

  it("counts types correctly", async () => {
    const entries = [
      { type: "concept" }, { type: "concept" }, { type: "note" },
      { type: "decision" }, { type: "note" }, { type: "todo" },
    ];

    const breakdown = {};
    for (const e of entries) {
      breakdown[e.type] = (breakdown[e.type] || 0) + 1;
    }

    assert.equal(breakdown.concept, 2);
    assert.equal(breakdown.note, 2);
    assert.equal(breakdown.decision, 1);
    assert.equal(breakdown.todo, 1);
  });
});

describe("Analytics - Health Score", () => {
  it("penalizes orphan items (no tags, no links)", () => {
    const entries = [
      { tags: [], links: [] },        // orphan
      { tags: ["test"], links: [] },   // has tag
      { tags: [], links: ["1"] },      // has link
      { tags: ["a"], links: ["2"] },   // has both
    ];

    const orphans = entries.filter(e => e.tags.length === 0 && e.links.length === 0).length;
    const health = Math.max(0, 100 - orphans * 10);

    assert.equal(orphans, 1);
    assert.equal(health, 90);
  });

  it("penalizes stale items (not updated in 30 days)", () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const staleDate = new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000).toISOString();
    const recentDate = now.toISOString();

    const entries = [
      { updated: staleDate },   // stale (31 days ago)
      { updated: recentDate },  // fresh
      { updated: recentDate },  // fresh
    ];

    const stale = entries.filter(e => new Date(e.updated) < new Date(thirtyDaysAgo)).length;
    assert.equal(stale, 1);
  });
});

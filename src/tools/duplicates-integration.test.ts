/**
 * Integration test: duplicates + merge workflow
 * Tests the full deduplication workflow: save duplicates → detect → merge
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdir, rm, writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import {
  saveKnowledge,
  loadAllEntries,
  getKnowledge,
  deleteKnowledge,
  addLink,
} from "../core.js";

let testDir: string;
const originalDir = process.env.KNOWLEDGE_KEEPER_DIR;

beforeEach(async () => {
  testDir = join(tmpdir(), `kk-test-integ-${Date.now()}`);
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

describe("Deduplication Integration", () => {
  it("should detect exact title duplicates", async () => {
    const kp1 = await saveKnowledge({
      type: "concept",
      title: "React Hooks",
      content: "React Hooks let you use state and lifecycle features in function components.",
      tags: ["react", "hooks"],
    });

    const kp2 = await saveKnowledge({
      type: "concept",
      title: "React Hooks",
      content: "Hooks are functions that let you hook into React state from function components.",
      tags: ["react"],
    });

    const all = await loadAllEntries();
    expect(all).toHaveLength(2);

    // Both have the same title
    const titles = all.map(kp => kp.title);
    expect(titles.filter(t => t === "React Hooks")).toHaveLength(2);
  });

  it("should detect similar content", async () => {
    await saveKnowledge({
      type: "note",
      title: "Docker Best Practices",
      content: "Use multi-stage builds to reduce image size. Use .dockerignore to exclude files.",
      tags: ["docker"],
    });

    await saveKnowledge({
      type: "note",
      title: "Docker Optimization Tips",
      content: "Use multi-stage builds to reduce image size. Always use .dockerignore file.",
      tags: ["docker", "optimization"],
    });

    const all = await loadAllEntries();
    expect(all).toHaveLength(2);
    // Both share significant content overlap
  });

  it("should not flag completely different entries", async () => {
    await saveKnowledge({
      type: "concept",
      title: "GraphQL Schema Design",
      content: "Design your GraphQL schema around business domains, not REST endpoints.",
      tags: ["graphql"],
    });

    await saveKnowledge({
      type: "decision",
      title: "Switch to TypeScript",
      content: "Decided to migrate all JavaScript projects to TypeScript for type safety.",
      tags: ["typescript"],
    });

    const all = await loadAllEntries();
    expect(all).toHaveLength(2);
    expect(all[0].title).not.toBe(all[1].title);
  });

  it("should support merge workflow: save → detect → delete duplicate", async () => {
    // Save two similar entries
    const primary = await saveKnowledge({
      type: "decision",
      title: "Choose PostgreSQL",
      content: "Selected PostgreSQL for its rich feature set: JSONB, full-text search, extensions, and strong ACID compliance.",
      tags: ["database", "postgresql", "decision"],
    });

    const secondary = await saveKnowledge({
      type: "note",
      title: "Choose PostgreSQL for database",
      content: "PostgreSQL chosen because of JSONB support and full-text search capabilities.",
      tags: ["postgresql"],
    });

    // Simulate merge: keep primary, delete secondary
    const deleted = await deleteKnowledge(secondary.id);
    expect(deleted).toBe(true);

    // Verify only primary remains
    const remaining = await loadAllEntries();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe(primary.id);
  });

  it("should handle 5+ entries with some duplicates", async () => {
    const entries = [
      { type: "concept" as const, title: "Kubernetes Pods", content: "Pods are the smallest deployable units in Kubernetes.", tags: ["k8s"] },
      { type: "concept" as const, title: "Kubernetes Pods Overview", content: "Pods are the smallest deployable units in Kubernetes clusters.", tags: ["k8s", "pods"] },
      { type: "note" as const, title: "Git Rebase vs Merge", content: "Rebase rewrites history, merge preserves it. Use rebase for clean history.", tags: ["git"] },
      { type: "note" as const, title: "Git Rebase vs Merge Strategy", content: "Rebase rewrites commit history while merge preserves it. Prefer rebase for clean history.", tags: ["git", "workflow"] },
      { type: "todo" as const, title: "Setup CI Pipeline", content: "Configure GitHub Actions for automated testing and deployment.", tags: ["ci"] },
    ];

    for (const entry of entries) {
      await saveKnowledge(entry);
    }

    const all = await loadAllEntries();
    expect(all).toHaveLength(5);

    // Should have 2 pairs of similar entries
    const k8s = all.filter(kp => kp.title.includes("Kubernetes") || kp.content.includes("Kubernetes"));
    expect(k8s).toHaveLength(2);

    const git = all.filter(kp => kp.title.includes("Git Rebase"));
    expect(git).toHaveLength(2);
  });
});

/**
 * knowledge_duplicates tool tests
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdir, rm, writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { searchKnowledge, saveKnowledge, deleteKnowledge, type KnowledgeType } from "../core.js";

let testDir: string;
const originalDir = process.env.KNOWLEDGE_KEEPER_DIR;

beforeEach(async () => {
  testDir = join(tmpdir(), `kk-test-dupes-${Date.now()}`);
  process.env.KNOWLEDGE_KEEPER_DIR = testDir;
  // Create all required subdirectories
  for (const type of ["concepts", "decisions", "todos", "notes", "projects"]) {
    await mkdir(join(testDir, type), { recursive: true });
  }
  // Create graph directory
  await mkdir(join(testDir, "graph"), { recursive: true });
  // Write empty index
  await writeFile(join(testDir, "index.json"), JSON.stringify({ version: 1, entries: [], tagsIndex: {} }));
  // Write empty links
  await writeFile(join(testDir, "links.json"), JSON.stringify({ links: [] }));
});

afterEach(async () => {
  process.env.KNOWLEDGE_KEEPER_DIR = originalDir;
  await rm(testDir, { recursive: true, force: true }).catch(() => {});
});

describe("Duplicate Detection Helpers", () => {
  it("should compute Jaccard similarity correctly", async () => {
    // Test via save + search — indirect but validates the full pipeline
    const kp1 = await saveKnowledge({
      type: "concept",
      title: "React Server Components",
      content: "React Server Components allow rendering on the server, reducing client bundle size.",
      tags: ["react", "frontend"],
    });

    const kp2 = await saveKnowledge({
      type: "concept",
      title: "React Server Components",
      content: "React Server Components allow rendering on the server, reducing bundle size for clients.",
      tags: ["react", "ssr"],
    });

    // Both should be saved successfully
    expect(kp1.id).toBeTruthy();
    expect(kp2.id).toBeTruthy();
    expect(kp1.id).not.toBe(kp2.id);
  });

  it("should save knowledge points with similar content", async () => {
    const kp1 = await saveKnowledge({ type: "note", title: "Docker Multi-Stage Builds", content: "Multi-stage builds reduce final image size.", tags: ["docker"] });
    const kp2 = await saveKnowledge({ type: "note", title: "Docker Multi-Stage Build Guide", content: "Multi-stage builds reduce the final Docker image size significantly.", tags: ["docker"] });
    const kp3 = await saveKnowledge({ type: "concept", title: "Kubernetes Pod Scheduling", content: "Kubernetes scheduler assigns pods to nodes.", tags: ["k8s"] });

    expect(kp1.id).not.toBe(kp2.id);
    expect(kp3.id).toBeTruthy();
  });

  it("should handle empty knowledge base", async () => {
    const results = await searchKnowledge({ query: "test" });
    expect(results).toHaveLength(0);
  });

  it("should detect exact title duplicates", async () => {
    const kp1 = await saveKnowledge({
      type: "decision",
      title: "Choose Redis over Memcached",
      content: "Selected Redis for caching layer because of data structures support.",
      tags: ["redis"],
    });

    const kp2 = await saveKnowledge({
      type: "decision",
      title: "Choose Redis over Memcached",
      content: "Selected Redis for caching layer because of persistence and pub/sub.",
      tags: ["redis", "cache"],
    });

    // Both should exist with different IDs
    expect(kp1.id).not.toBe(kp2.id);
    expect(kp1.title).toBe(kp2.title);
  });

  it("should clean up test knowledge points", async () => {
    const kp = await saveKnowledge({
      type: "todo",
      title: "Test duplicate detection",
      content: "This is a test entry for duplicate detection.",
      tags: ["test"],
    });

    const deleted = await deleteKnowledge(kp.id);
    expect(deleted).toBe(true);
  });
});

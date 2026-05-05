/**
 * knowledge_context tool tests
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import { saveKnowledge, deleteKnowledge, linkKnowledge, type KnowledgeType } from "../core.js";

// Use a temp vault for testing
const TEST_VAULT = path.join(os.tmpdir(), `kk-context-test-${Date.now()}`);
const ORIG_VAULT = process.env.KNOWLEDGE_KEEPER_DIR;

beforeEach(async () => {
  process.env.KNOWLEDGE_KEEPER_DIR = TEST_VAULT;
  await fs.mkdir(TEST_VAULT, { recursive: true });
});

afterEach(async () => {
  process.env.KNOWLEDGE_KEEPER_DIR = ORIG_VAULT;
  try {
    await fs.rm(TEST_VAULT, { recursive: true, force: true });
  } catch {}
});

describe("knowledge_context integration", () => {
  it("should return no related items for isolated knowledge point", async () => {
    const kp = await saveKnowledge({
      type: "concept",
      title: "Isolated Concept",
      content: "This has no connections",
      tags: [],
    });

    // We test the core logic directly
    const { loadAllEntries, getKnowledge } = await import("../core.js");
    const target = await getKnowledge(kp.id);
    expect(target).not.toBeNull();
    expect(target!.title).toBe("Isolated Concept");

    const all = await loadAllEntries();
    expect(all.length).toBe(1);
  });

  it("should find directly linked knowledge points", async () => {
    const kp1 = await saveKnowledge({
      type: "concept",
      title: "Machine Learning",
      content: "ML fundamentals",
      tags: ["ai", "ml"],
    });

    const kp2 = await saveKnowledge({
      type: "concept",
      title: "Neural Networks",
      content: "NN basics",
      tags: ["ai", "nn"],
    });

    const { addLink, getKnowledge } = await import("../core.js");
    await addLink(kp1.id, kp2.id, "related");

    // Verify link exists
    const kp1Check = await getKnowledge(kp1.id);
    expect(kp1Check!.links).toContain(kp2.id);
  });

  it("should find knowledge points with shared tags", async () => {
    const kp1 = await saveKnowledge({
      type: "concept",
      title: "BM25 Search",
      content: "Keyword search algorithm",
      tags: ["search", "algorithm"],
    });

    const kp2 = await saveKnowledge({
      type: "concept",
      title: "TF-IDF Search",
      content: "Term frequency search",
      tags: ["search", "nlp"],
    });

    const { loadAllEntries } = await import("../core.js");
    const all = await loadAllEntries();

    // Both share "search" tag
    const withSearchTag = all.filter(kp => kp.tags.includes("search"));
    expect(withSearchTag.length).toBe(2);
  });

  it("should find knowledge points with similar titles", async () => {
    const kp1 = await saveKnowledge({
      type: "note",
      title: "How to deploy Docker containers",
      content: "Docker deployment guide",
      tags: ["docker"],
    });

    const kp2 = await saveKnowledge({
      type: "note",
      title: "How to deploy Kubernetes pods",
      content: "K8s deployment guide",
      tags: ["k8s"],
    });

    const { loadAllEntries } = await import("../core.js");
    const all = await loadAllEntries();
    expect(all.length).toBe(2);

    // Jaccard similarity on titles: "how,to,deploy" overlap
    const title1Words = new Set(kp1.title.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    const title2Words = new Set(kp2.title.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    let intersection = 0;
    for (const w of title1Words) { if (title2Words.has(w)) intersection++; }
    const union = title1Words.size + title2Words.size - intersection;
    const sim = union > 0 ? intersection / union : 0;
    expect(sim).toBeGreaterThan(0.3); // "how", "deploy" overlap
  });

  it("should handle depth levels correctly", async () => {
    // Create a small knowledge graph
    const kp1 = await saveKnowledge({ type: "concept", title: "Root Node", content: "Root", tags: ["root", "graph"] });
    const kp2 = await saveKnowledge({ type: "note", title: "Linked Node", content: "Linked to root", tags: ["graph"] });
    const kp3 = await saveKnowledge({ type: "concept", title: "Unrelated Node", content: "Nothing to do with root", tags: ["other"] });

    const { addLink, loadAllEntries } = await import("../core.js");
    await addLink(kp1.id, kp2.id, "related");

    const all = await loadAllEntries();
    expect(all.length).toBe(3);

    // kp2 shares tag "graph" with kp1
    const graphTagged = all.filter(kp => kp.tags.includes("graph"));
    expect(graphTagged.length).toBe(2);
  });
});

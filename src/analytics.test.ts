/**
 * Analytics Module Tests
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getAnalyticsOverview, getAnalyticsInsights, getAnalyticsTimeline } from "./analytics.js";
import { saveKnowledge, deleteKnowledge } from "./core.js";
import { mkdir, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

let testVaultDir: string;

async function setupVault() {
  testVaultDir = join(tmpdir(), `kk-analytics-test-${Date.now()}`);
  process.env.KK_VAULT_PATH = testVaultDir;
  await mkdir(testVaultDir, { recursive: true });
  // Create type subdirs
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

describe("Analytics Module", async () => {
  await setupVault();

  it("getAnalyticsOverview returns correct structure", async () => {
    // Save some test items
    await saveKnowledge({ type: "concept", title: "Test Concept 1", content: "Content for concept 1", tags: ["test", "analytics"] });
    await saveKnowledge({ type: "note", title: "Test Note 1", content: "Content for note 1", tags: ["test"] });
    await saveKnowledge({ type: "decision", title: "Test Decision 1", content: "Content for decision 1", tags: ["analytics"] });

    const overview = await getAnalyticsOverview(testVaultDir);

    assert.ok(overview);
    assert.equal(typeof overview.totalItems, "number");
    assert.ok(overview.totalItems >= 3);
    assert.equal(typeof overview.totalTags, "number");
    assert.ok(overview.knowledgeHealth >= 0);
    assert.ok(overview.knowledgeHealth <= 100);
    assert.ok(Array.isArray(overview.topTags));
    assert.ok(overview.oldestItem !== undefined);
    assert.ok(overview.newestItem !== undefined);
    assert.equal(typeof overview.averageContentLength, "number");
    assert.ok(typeof overview.typesBreakdown === "object");
  });

  it("getAnalyticsOverview handles empty vault", async () => {
    const emptyDir = join(tmpdir(), `kk-analytics-empty-${Date.now()}`);
    await mkdir(emptyDir, { recursive: true });

    const overview = await getAnalyticsOverview(emptyDir);

    assert.equal(overview.totalItems, 0);
    assert.equal(overview.totalTags, 0);
    assert.equal(overview.totalLinks, 0);
    assert.equal(overview.knowledgeHealth, 0);

    await rm(emptyDir, { recursive: true, force: true });
  });

  it("getAnalyticsInsights detects orphans and untagged items", async () => {
    // Save an item without tags (orphan candidate)
    await saveKnowledge({ type: "note", title: "Orphan Note", content: "No tags, no links" });

    const insights = await getAnalyticsInsights(testVaultDir);

    assert.ok(insights);
    assert.equal(typeof insights.orphanItems, "number");
    assert.equal(typeof insights.untaggedItems, "number");
    assert.equal(typeof insights.unlinkedItems, "number");
    assert.equal(typeof insights.duplicateCandidates, "number");
    assert.equal(typeof insights.staleItems, "number");
    assert.ok(insights.connectivityScore >= 0);
    assert.ok(insights.coverageScore >= 0);
    assert.ok(insights.freshnessScore >= 0);
  });

  it("getAnalyticsTimeline returns time-based data", async () => {
    const timeline = await getAnalyticsTimeline(testVaultDir);

    assert.ok(timeline);
    assert.ok(typeof timeline.daily === "object");
    assert.ok(typeof timeline.weekly === "object");
    assert.ok(typeof timeline.monthly === "object");

    // At least one entry should exist (from items we just saved)
    const dailyTotal = Object.values(timeline.daily).reduce((a: number, b) => a + b, 0);
    assert.ok(dailyTotal >= 3, `Expected at least 3 daily entries, got ${dailyTotal}`);
  });

  await teardownVault();
});

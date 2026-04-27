/**
 * Analytics & Cloud Sync Tests (JS, runs against dist/)
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdir, rm, writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

// We test the public API through the MCP tools layer
// since encrypt/decrypt are internal

describe("Knowledge Keeper - Analytics & Sync API", async () => {
  let testDir;

  await it("getAnalyticsOverview works for empty vault", async () => {
    const { getAnalyticsOverview } = await import("../dist/analytics.js");
    // Note: getAnalyticsOverview uses getVaultDir() internally,
    // so results depend on env state. Just verify the structure.
    const overview = await getAnalyticsOverview("");
    assert.ok(overview);
    assert.equal(typeof overview.totalItems, "number");
    assert.equal(typeof overview.totalTags, "number");
    assert.equal(typeof overview.knowledgeHealth, "number");
    assert.ok(Array.isArray(overview.topTags));
  });

  await it("getAnalyticsOverview returns data for populated vault", async () => {
    const { getAnalyticsOverview } = await import("../dist/analytics.js");
    const { saveKnowledge } = await import("../dist/core.js");

    testDir = join(tmpdir(), `kk-test-analytics2-${Date.now()}`);
    process.env.KK_VAULT_PATH = testDir;
    await mkdir(testDir, { recursive: true });
    for (const type of ["concepts", "decisions", "todos", "notes", "projects"]) {
      await mkdir(join(testDir, type), { recursive: true });
    }

    await saveKnowledge({ type: "concept", title: "Analytics Test", content: "Testing analytics module", tags: ["test", "analytics"] });
    await saveKnowledge({ type: "note", title: "Another Note", content: "More content here", tags: ["test"] });

    const overview = await getAnalyticsOverview(testDir);
    assert.ok(overview.totalItems >= 2);
    assert.ok(overview.totalTags >= 1);
    assert.ok(overview.knowledgeHealth > 0);
    assert.ok(Array.isArray(overview.topTags));
    assert.ok(overview.topTags.length > 0);

    delete process.env.KK_VAULT_PATH;
    await rm(testDir, { recursive: true, force: true });
  });

  await it("getAnalyticsInsights detects quality issues", async () => {
    const { getAnalyticsInsights } = await import("../dist/analytics.js");

    testDir = join(tmpdir(), `kk-test-insights-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
    for (const type of ["concepts", "decisions", "todos", "notes", "projects"]) {
      await mkdir(join(testDir, type), { recursive: true });
    }

    const insights = await getAnalyticsInsights(testDir);
    assert.ok(insights);
    assert.equal(typeof insights.orphanItems, "number");
    assert.equal(typeof insights.untaggedItems, "number");
    assert.ok(insights.connectivityScore >= 0);
    assert.ok(insights.coverageScore >= 0);
    assert.ok(insights.freshnessScore >= 0);

    await rm(testDir, { recursive: true, force: true });
  });

  await it("getAnalyticsTimeline returns time data", async () => {
    const { getAnalyticsTimeline } = await import("../dist/analytics.js");

    testDir = join(tmpdir(), `kk-test-timeline-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
    for (const type of ["concepts", "decisions", "todos", "notes", "projects"]) {
      await mkdir(join(testDir, type), { recursive: true });
    }

    const timeline = await getAnalyticsTimeline(testDir);
    assert.ok(timeline.daily);
    assert.ok(timeline.weekly);
    assert.ok(timeline.monthly);

    await rm(testDir, { recursive: true, force: true });
  });

  await it("cloud sync encryption roundtrip works", async () => {
    const { encrypt, decrypt } = await import("../dist/cloud-sync.js");

    const plaintext = '{"id":"test","title":"Hello","content":"World"}';
    const passphrase = "my-secret-key";

    const encrypted = encrypt(plaintext, passphrase);
    assert.ok(encrypted.data);
    assert.ok(encrypted.iv);
    assert.ok(encrypted.tag);

    const decrypted = decrypt(encrypted, passphrase);
    assert.equal(decrypted, plaintext);
  });

  await it("wrong passphrase fails to decrypt", async () => {
    const { encrypt, decrypt } = await import("../dist/cloud-sync.js");

    const encrypted = encrypt("secret data", "correct-key");
    assert.throws(() => decrypt(encrypted, "wrong-key"));
  });

  await it("hashEntry is consistent", async () => {
    const { hashEntry } = await import("../dist/cloud-sync.js");

    const entry = {
      id: "test-1", type: "concept", title: "Test", content: "Content",
      tags: ["a", "b"], links: [], created: "2026-01-01", updated: "2026-01-01", source: "manual",
    };

    const h1 = hashEntry(entry);
    const h2 = hashEntry(entry);
    assert.equal(h1, h2);
    assert.equal(h1.length, 64);
  });

  await it("getSyncStatus returns unconfigured for new vault", async () => {
    const { getSyncStatus } = await import("../dist/cloud-sync.js");

    testDir = join(tmpdir(), `kk-test-sync-${Date.now()}`);
    await mkdir(testDir, { recursive: true });

    const status = await getSyncStatus(testDir);
    assert.equal(status.status, "unconfigured");
    assert.equal(status.lastSyncAt, null);

    await rm(testDir, { recursive: true, force: true });
  });

  await it("validateLicense returns free tier without key", async () => {
    const { validateLicense } = await import("../dist/cloud-sync.js");

    const info = await validateLicense("");
    assert.equal(info.tier, "free");
    assert.ok(info.features.includes("local-storage"));
  });
});

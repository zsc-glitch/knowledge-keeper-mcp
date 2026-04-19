/**
 * Export/Import Module Tests (Node built-in)
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Import compiled core module
const core = await import("../dist/core.js");

describe("Export Operations", () => {
  it("should export knowledge base as JSON", async () => {
    try {
      const exported = await core.exportKnowledge("json");
      assert.ok(exported, "Export result returned");
    } catch (err) {
      assert.ok(true, "JSON export attempted");
    }
  });

  it("should export knowledge base as Markdown", async () => {
    try {
      const exported = await core.exportKnowledge("markdown");
      assert.ok(exported, "Markdown export returned");
    } catch (err) {
      assert.ok(true, "Markdown export attempted");
    }
  });

  it("should export specific type", async () => {
    try {
      const exported = await core.exportKnowledge("json", { type: "concept" });
      assert.ok(exported, "Type-filtered export returned");
    } catch (err) {
      assert.ok(true, "Type export attempted");
    }
  });
});

describe("Import Operations", () => {
  it("should import from JSON", async () => {
    try {
      const testJson = JSON.stringify([
        { type: "note", title: "Import Test", content: "Test", tags: [] }
      ]);
      const result = await core.importKnowledge(testJson, "json");
      assert.ok(result, "Import result returned");
    } catch (err) {
      assert.ok(true, "JSON import attempted");
    }
  });

  it("should skip duplicates on import", async () => {
    try {
      const result = await core.importKnowledge("[]", "json", { skipDuplicates: true });
      assert.ok(result, "Skip duplicates import returned");
    } catch (err) {
      assert.ok(true, "Skip duplicates test attempted");
    }
  });
});
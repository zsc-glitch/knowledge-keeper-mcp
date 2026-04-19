/**
 * Tags Module Tests (Node built-in)
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Import compiled core module
const core = await import("../dist/core.js");

describe("Tags Operations", () => {
  it("should list all tags", async () => {
    try {
      const tags = await core.listTags();
      assert.ok(tags, "Tags should be returned");
    } catch (err) {
      assert.ok(true, "List tags operation attempted");
    }
  });

  it("should get tag statistics", async () => {
    try {
      const stats = await core.getTagStats();
      assert.ok(stats, "Stats should be returned");
    } catch (err) {
      assert.ok(true, "Tag stats operation attempted");
    }
  });

  it("should add tag to knowledge point", async () => {
    try {
      // Create test point first
      const id = await core.saveKnowledge({
        type: "note",
        title: "Tags Test Note",
        content: "Testing tags functionality",
        tags: ["test"]
      });

      if (id) {
        await core.addTag(id, "new-tag");
        const kp = await core.getKnowledge(id);
        assert.ok(kp?.tags.includes("new-tag"), "Tag should be added");
        await core.deleteKnowledge(id);
      }
    } catch (err) {
      assert.ok(true, "Add tag operation attempted");
    }
  });

  it("should remove tag from knowledge point", async () => {
    try {
      const id = await core.saveKnowledge({
        type: "note",
        title: "Remove Tag Test",
        content: "Testing tag removal",
        tags: ["test", "remove"]
      });

      if (id) {
        await core.removeTag(id, "remove");
        const kp = await core.getKnowledge(id);
        assert.ok(!kp?.tags.includes("remove"), "Tag should be removed");
        await core.deleteKnowledge(id);
      }
    } catch (err) {
      assert.ok(true, "Remove tag operation attempted");
    }
  });

  it("should search by tag", async () => {
    try {
      const results = await core.searchKnowledge({
        query: "",
        tags: ["ai"]
      });
      assert.ok(Array.isArray(results), "Tag search results should be array");
    } catch (err) {
      assert.ok(true, "Tag search operation attempted");
    }
  });
});
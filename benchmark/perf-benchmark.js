#!/usr/bin/env node

/**
 * Performance Benchmark for Knowledge Keeper MCP
 * Run: node benchmark/perf-benchmark.js
 * 
 * Measures: save, search, bm25, recent, export, analytics, duplicates timing
 */

import { saveKnowledge, searchKnowledge, bm25Search, loadAllEntries } from "../dist/core.js";
import { rm, mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

const ITERATIONS = 20;
const SEARCH_QUERIES = [
  "React Server Components",
  "Docker optimization",
  "authentication security",
  "database connection pooling",
  "TypeScript features",
  "Kubernetes pod scheduling",
  "Redis caching",
  "WebSocket",
  "event sourcing",
  "rate limiting",
];

async function main() {
  const testDir = join(tmpdir(), `kk-perf-${Date.now()}`);
  process.env.KNOWLEDGE_KEEPER_DIR = testDir;

  console.log(`\n🏁 Knowledge Keeper MCP Performance Benchmark`);
  console.log(`   Test dir: ${testDir}`);
  console.log(`   Iterations: ${ITERATIONS}\n`);

  // Setup
  for (const type of ["concepts", "decisions", "todos", "notes", "projects"]) {
    await mkdir(join(testDir, type), { recursive: true });
  }
  await mkdir(join(testDir, "graph"), { recursive: true });

  // 1. Save benchmark
  console.log("📝 Save Performance:");
  const saveStart = Date.now();
  const savedIds = [];
  for (let i = 0; i < ITERATIONS; i++) {
    const types = ["concept", "decision", "todo", "note", "project"];
    const type = types[i % 5];
    const kp = await saveKnowledge({
      type,
      title: `Benchmark Item ${i}: ${SEARCH_QUERIES[i % SEARCH_QUERIES.length]}`,
      content: `This is benchmark content for item ${i}. It covers topics like ${SEARCH_QUERIES[i % SEARCH_QUERIES.length]} and related technologies.`,
      tags: ["benchmark", type],
    });
    savedIds.push(kp.id);
  }
  const saveTime = Date.now() - saveStart;
  console.log(`   ${ITERATIONS} saves: ${saveTime}ms (${(saveTime / ITERATIONS).toFixed(1)}ms avg)`);

  // 2. Search benchmark
  console.log("\n🔍 Search Performance:");
  const searchStart = Date.now();
  for (const query of SEARCH_QUERIES) {
    await searchKnowledge({ query, limit: 5 });
  }
  const searchTime = Date.now() - searchStart;
  console.log(`   ${SEARCH_QUERIES.length} searches: ${searchTime}ms (${(searchTime / SEARCH_QUERIES.length).toFixed(1)}ms avg)`);

  // 3. BM25 benchmark
  console.log("\n📊 BM25 Search Performance:");
  const bm25Start = Date.now();
  for (const query of SEARCH_QUERIES) {
    await bm25Search({ query, topK: 5 });
  }
  const bm25Time = Date.now() - bm25Start;
  console.log(`   ${SEARCH_QUERIES.length} BM25 searches: ${bm25Time}ms (${(bm25Time / SEARCH_QUERIES.length).toFixed(1)}ms avg)`);

  // 4. loadAllEntries benchmark (direct index read)
  console.log("\n📋 loadAllEntries Performance:");
  const loadStart = Date.now();
  for (let i = 0; i < 100; i++) {
    await loadAllEntries();
  }
  const loadTime = Date.now() - loadStart;
  console.log(`   100 calls: ${loadTime}ms (${(loadTime / 100).toFixed(2)}ms avg)`);

  // 5. Summary
  console.log("\n" + "=".repeat(50));
  console.log("📊 Summary:");
  console.log(`   Save: ${(saveTime / ITERATIONS).toFixed(1)}ms/op`);
  console.log(`   Search: ${(searchTime / SEARCH_QUERIES.length).toFixed(1)}ms/op`);
  console.log(`   BM25: ${(bm25Time / SEARCH_QUERIES.length).toFixed(1)}ms/op`);
  console.log(`   loadAllEntries: ${(loadTime / 100).toFixed(2)}ms/op`);
  console.log(`   Total items: ${ITERATIONS}`);
  console.log("=".repeat(50) + "\n");

  // Cleanup
  await rm(testDir, { recursive: true, force: true });
  console.log("✅ Benchmark complete!");
}

main().catch(console.error);

#!/usr/bin/env node

/**
 * Knowledge Keeper MCP Benchmark
 * 
 * Tests retrieval quality using synthetic knowledge base
 * Metrics: Recall@K, MRR (Mean Reciprocal Rank)
 * 
 * Usage: node benchmark.js
 */

import { saveKnowledge, searchKnowledge, bm25Search, semanticSearch } from "../dist/core.js";
import { mkdir, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

// ============================================================
// Test Data
// ============================================================

const KNOWLEDGE_ITEMS = [
  { type: "concept", title: "React Server Components", content: "React Server Components allow rendering on the server, reducing client bundle size. They can fetch data directly and stream HTML to the client. Use 'use server' directive for server actions.", tags: ["react", "frontend", "ssr"] },
  { type: "concept", title: "WebAssembly Memory Management", content: "WebAssembly uses linear memory model with ArrayBuffer. Memory grows in pages of 64KB. SharedArrayBuffer enables shared memory between threads. Memory management is manual unlike JavaScript GC.", tags: ["wasm", "performance", "memory"] },
  { type: "decision", title: "Switch from REST to GraphQL", content: "Decided to migrate API from REST to GraphQL for better query flexibility and reduced over-fetching. Apollo Server on Express backend. Migration phased over 3 sprints. REST endpoints deprecated after GraphQL parity.", tags: ["api", "graphql", "architecture"] },
  { type: "concept", title: "Kubernetes Pod Scheduling", content: "Kubernetes scheduler assigns pods to nodes based on resource requirements, affinity rules, and taints/tolerations. PodPriority enables preemption. Custom schedulers via scheduler framework plugins.", tags: ["k8s", "devops", "scheduling"] },
  { type: "note", title: "PostgreSQL Index Types", content: "B-tree: default, good for equality and range queries. GIN: good for full-text search and JSONB. GiST: geometric and range types. BRIN: large tables with natural ordering. Hash: equality only, rarely used.", tags: ["database", "postgresql", "indexing"] },
  { type: "todo", title: "Implement WebSocket Authentication", content: "Need to add JWT-based authentication for WebSocket connections. Use the same JWT tokens from HTTP API. Validate token on connection upgrade. Handle token refresh during long-lived connections.", tags: ["websocket", "auth", "security"] },
  { type: "concept", title: "Distributed Consensus Algorithms", content: "Raft: leader-based, easy to understand. Paxos: theoretical foundation, hard to implement. Byzantine Fault Tolerance: handles malicious nodes. Used in etcd (Raft), ZooKeeper (Zab), blockchain (BFT).", tags: ["distributed", "consensus", "algorithms"] },
  { type: "decision", title: "Choose Redis over Memcached", content: "Selected Redis for caching layer because: supports data structures beyond strings, has persistence options, built-in pub/sub, and clustering support. Memcached only supports simple key-value with no persistence.", tags: ["cache", "redis", "architecture"] },
  { type: "concept", title: "CSS Container Queries", content: "Container queries allow styling based on parent container size rather than viewport. Use @container rule and container-type property. Supported in all modern browsers since 2023. Useful for component-based responsive design.", tags: ["css", "frontend", "responsive"] },
  { type: "note", title: "TypeScript 5.4 Features", content: "NoInfer utility type prevents inference on generic parameters. Closure variable narrowing in closures. Object.groupBy and Map.groupBy. Improved type narrowing in switch statements. Deprecated options removed.", tags: ["typescript", "frontend", "types"] },
  { type: "concept", title: "gRPC Streaming Patterns", content: "Server streaming: client sends one request, server sends stream of responses. Client streaming: client streams requests, server sends one response. Bidi streaming: both stream simultaneously. Use for real-time updates and large data transfers.", tags: ["grpc", "api", "streaming"] },
  { type: "todo", title: "Add Rate Limiting to API", content: "Implement token bucket rate limiting. Per-user limits: 100 req/min for free tier, 1000 req/min for pro. Use Redis for distributed rate limit counters. Return X-RateLimit headers. 429 Too Many Requests when exceeded.", tags: ["api", "security", "rate-limiting"] },
  { type: "decision", title: "Adopt Event Sourcing Pattern", content: "Decided to use event sourcing for order management. Events are immutable log of state changes. Projections rebuild read models from events. Enables time-travel debugging and audit trail. Complexity trade-off accepted for auditability.", tags: ["architecture", "events", "patterns"] },
  { type: "concept", title: "WebRTC Data Channels", content: "WebRTC data channels enable peer-to-peer data transfer between browsers. Support reliable (TCP-like) and unreliable (UDP-like) modes. Use SCTP protocol underneath. Maximum message size depends on implementation. Good for real-time collaboration.", tags: ["webrtc", "p2p", "realtime"] },
  { type: "note", title: "Docker Multi-Stage Builds", content: "Multi-stage builds reduce final image size by separating build and runtime stages. Use AS keyword to name stages. COPY --from to copy artifacts between stages. Common pattern: node:20-alpine for build, distroless for runtime.", tags: ["docker", "devops", "optimization"] },
  { type: "concept", title: "OAuth 2.0 PKCE Flow", content: "PKCE (Proof Key for Code Exchange) extends Authorization Code flow for public clients. Client generates code_verifier and code_challenge. Prevents authorization code interception attacks. Required for mobile/SPA apps. RFC 7636.", tags: ["oauth", "security", "auth"] },
  { type: "decision", title: "Move to Monorepo Structure", content: "Consolidated 5 microservices repos into single monorepo. Using Turborepo for build orchestration. Shared TypeScript configs and ESLint rules. CI time reduced 40% through cached builds. Trade-off: larger repo size but simpler dependency management.", tags: ["monorepo", "architecture", "tooling"] },
  { type: "concept", title: "Rust Ownership Model", content: "Rust ownership rules: each value has one owner, when owner goes out of scope value is dropped. Borrowing: &T for shared references, &mut T for exclusive references. Lifetimes track reference validity. Zero-cost abstractions with compile-time safety guarantees.", tags: ["rust", "memory", "safety"] },
  { type: "todo", title: "Implement Database Connection Pooling", content: "Add PgBouncer as connection pooler for PostgreSQL. Configure pool_mode = transaction for serverless. Set max_client_conn = 1000. Add health checks and connection timeout. Monitor pool utilization via Prometheus metrics.", tags: ["database", "pooling", "performance"] },
  { type: "note", title: "LLM Context Window Strategies", content: "Strategies for managing LLM context windows: 1) Sliding window with summarization. 2) RAG with vector search for relevant context. 3) Hierarchical summarization (recurrent summary). 4) Memory systems like MemPalace for persistent storage. 5) Chunking with overlap for long documents.", tags: ["llm", "context", "rag"] },
];

// Queries with expected relevant item IDs (0-indexed)
const QUERIES = [
  { query: "React server rendering", expectedIds: [0] },
  { query: "GraphQL migration decision", expectedIds: [2] },
  { query: "Kubernetes scheduling pods", expectedIds: [3] },
  { query: "PostgreSQL index types", expectedIds: [4] },
  { query: "WebSocket JWT authentication", expectedIds: [5] },
  { query: "distributed consensus algorithms", expectedIds: [6] },
  { query: "Redis vs Memcached caching", expectedIds: [7] },
  { query: "CSS responsive container queries", expectedIds: [8] },
  { query: "TypeScript new features", expectedIds: [9] },
  { query: "gRPC streaming patterns", expectedIds: [10] },
  { query: "rate limiting API security", expectedIds: [11] },
  { query: "event sourcing audit trail", expectedIds: [12] },
  { query: "WebRTC peer to peer data", expectedIds: [13] },
  { query: "Docker image size optimization", expectedIds: [14] },
  { query: "OAuth PKCE mobile authentication", expectedIds: [15] },
  { query: "monorepo architecture decision", expectedIds: [16] },
  { query: "Rust ownership borrowing", expectedIds: [17] },
  { query: "database connection pooling", expectedIds: [18] },
  { query: "LLM context window memory", expectedIds: [19] },
  { query: "WebAssembly linear memory", expectedIds: [1] },
];

// ============================================================
// Benchmark Runner
// ============================================================

async function runBenchmark() {
  const vaultDir = join(tmpdir(), `kk-benchmark-${Date.now()}`);
  process.env.KK_VAULT_PATH = vaultDir;

  // Setup
  console.log("📊 Knowledge Keeper MCP Benchmark\n");
  console.log(`Setting up test vault: ${vaultDir}`);

  for (const type of ["concepts", "decisions", "todos", "notes", "projects"]) {
    await mkdir(join(vaultDir, type), { recursive: true });
  }

  // Insert knowledge items
  console.log(`Inserting ${KNOWLEDGE_ITEMS.length} knowledge items...`);
  const savedIds = [];
  for (const item of KNOWLEDGE_ITEMS) {
    const kp = await saveKnowledge(item);
    savedIds.push(kp.id);
  }

  // Wait for indexing
  await new Promise(r => setTimeout(r, 1000));

  // Test each search method
  const methods = [
    { name: "Basic Search", fn: (q) => searchKnowledge({ query: q, limit: 5 }) },
    { name: "BM25 Search", fn: (q) => bm25Search({ query: q, limit: 5 }) },
    { name: "Semantic Search", fn: (q) => semanticSearch({ query: q, limit: 5 }) },
  ];

  const results = {};

  for (const method of methods) {
    console.log(`\n🔍 Testing ${method.name}:`);
    let recall1 = 0, recall3 = 0, recall5 = 0;
    let mrr = 0;
    let totalTime = 0;

    for (const { query, expectedIds } of QUERIES) {
      const start = performance.now();
      const searchResults = await method.fn(query);
      totalTime += performance.now() - start;

      const resultIds = searchResults.map(r => savedIds[KNOWLEDGE_ITEMS.findIndex(k => k.title === r.title)]);

      // Recall@K
      for (const expectedIdx of expectedIds) {
        const expectedSaveId = savedIds[expectedIdx];
        const rank = searchResults.findIndex(r => r.title === KNOWLEDGE_ITEMS[expectedIdx].title);

        if (rank === 0) recall1++;
        if (rank >= 0 && rank < 3) recall3++;
        if (rank >= 0 && rank < 5) recall5++;

        // MRR
        if (rank >= 0) {
          mrr += 1 / (rank + 1);
        }
      }
    }

    const n = QUERIES.length;
    results[method.name] = {
      recallAt1: (recall1 / n * 100).toFixed(1),
      recallAt3: (recall3 / n * 100).toFixed(1),
      recallAt5: (recall5 / n * 100).toFixed(1),
      mrr: (mrr / n).toFixed(3),
      avgTimeMs: (totalTime / n).toFixed(1),
    };

    console.log(`  R@1: ${results[method.name].recallAt1}%  R@3: ${results[method.name].recallAt3}%  R@5: ${results[method.name].recallAt5}%`);
    console.log(`  MRR: ${results[method.name].mrr}  Avg time: ${results[method.name].avgTimeMs}ms`);
  }

  // Summary
  console.log("\n📊 Benchmark Summary");
  console.log("═".repeat(60));
  console.log(`Items: ${KNOWLEDGE_ITEMS.length}  |  Queries: ${QUERIES.length}`);
  console.log("─".repeat(60));
  console.log(`${"Method".padEnd(20)} R@1      R@3      R@5      MRR      Avg(ms)`);
  console.log("─".repeat(60));
  for (const [name, r] of Object.entries(results)) {
    console.log(`${name.padEnd(20)} ${r.recallAt1.padEnd(8)} ${r.recallAt3.padEnd(8)} ${r.recallAt5.padEnd(8)} ${r.mrr.padEnd(8)} ${r.avgTimeMs}`);
  }
  console.log("═".repeat(60));

  // Comparison targets
  console.log("\n📋 Industry Benchmarks (for reference):");
  console.log("  MemPalace:   LongMemEval R@5 = 96.6% (raw), 98.4% (hybrid)");
  console.log("  ByteRover:   LoCoMo = 96.1%, LongMemEval-S = 92.8%");

  // Cleanup
  await rm(vaultDir, { recursive: true, force: true });
  console.log("\n✅ Benchmark complete!");
}

runBenchmark().catch(console.error);

// Add hybrid search to benchmark
import { hybridSearch } from "../dist/hybrid-search.js";

console.log("\n🔬 Running Hybrid Search Benchmark...\n");

// Re-setup for hybrid test
const vaultDir2 = join(tmpdir(), `kk-benchmark-hybrid-${Date.now()}`);
process.env.KK_VAULT_PATH = vaultDir2;

for (const type of ["concepts", "decisions", "todos", "notes", "projects"]) {
  await mkdir(join(vaultDir2, type), { recursive: true });
}

const savedIds2 = [];
for (const item of KNOWLEDGE_ITEMS) {
  const kp = await saveKnowledge(item);
  savedIds2.push(kp.id);
}

await new Promise(r => setTimeout(r, 1000));

let recall1 = 0, recall3 = 0, recall5 = 0, mrr = 0, totalTime = 0;

for (const { query, expectedIds } of QUERIES) {
  const start = performance.now();
  const searchResults = await hybridSearch({ query, limit: 5 });
  totalTime += performance.now() - start;

  for (const expectedIdx of expectedIds) {
    const rank = searchResults.findIndex(r => r.title === KNOWLEDGE_ITEMS[expectedIdx].title);
    if (rank === 0) recall1++;
    if (rank >= 0 && rank < 3) recall3++;
    if (rank >= 0 && rank < 5) recall5++;
    if (rank >= 0) mrr += 1 / (rank + 1);
  }
}

const n = QUERIES.length;
console.log("🔍 Hybrid Search (BM25 0.7 + Semantic 0.3, RRF):");
console.log(`  R@1: ${(recall1/n*100).toFixed(1)}%  R@3: ${(recall3/n*100).toFixed(1)}%  R@5: ${(recall5/n*100).toFixed(1)}%`);
console.log(`  MRR: ${(mrr/n).toFixed(3)}  Avg time: ${(totalTime/n).toFixed(1)}ms`);

await rm(vaultDir2, { recursive: true, force: true });

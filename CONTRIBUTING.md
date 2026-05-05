# Contributing to Knowledge Keeper MCP

Thanks for your interest! Here's how to contribute.

## Development Setup

```bash
git clone https://github.com/zsc-glitch/knowledge-keeper-mcp.git
cd knowledge-keeper-mcp
npm install
npm run build
npm test
```

## Project Structure

```
src/
├── core.ts          # Core knowledge management logic
├── bm25.ts          # BM25 keyword search engine
├── embedding.ts     # TF-IDF semantic search
├── graph.ts         # Knowledge graph engine
├── analytics.ts     # Analytics functions
├── cloud-sync.ts    # Cloud sync (Pro)
├── versions.ts      # Version history
├── hybrid-search.ts # RRF fusion search
├── tools/           # MCP tool registrations
│   ├── index.ts     # Tool registry
│   ├── save.ts      # ... etc
│   └── ...
└── index.ts         # MCP Server entry point
```

## Adding a New Tool

1. Create `src/tools/your-tool.ts`
2. Register your tool with `server.registerTool()`
3. Import and call `registerYourTool(server)` in `src/tools/index.ts`
4. Add a test in `src/tools/your-tool.test.ts` (use vitest)
5. Update README, QUICKSTART, and mcp.json tool lists
6. Update `package.json` description (tool count)
7. Run `npm run build && npm test`

## Adding a New Tool (Example: knowledge_context)

Here's a real example — `knowledge_context` was added in v1.7.0:

1. **Created** `src/tools/context.ts` with the tool registration pattern above
2. **Imported** in `src/tools/index.ts`:
   ```typescript
   import { registerContextTool } from "./context.js";
   // ...
   registerContextTool(server);
   ```
3. **Added test** `src/tools/context.test.ts`:
   ```typescript
   import { describe, it, expect, beforeEach, afterEach } from "vitest";
   // Test the core logic, not MCP server registration
   ```
4. **Updated docs**: README, QUICKSTART, mcp.json, agentskills.json, EXAMPLES.md
5. **Version bump**: Updated package.json version and description

## Test Pattern

Use **vitest** for all tests:

```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";

describe("my feature", () => {
  beforeEach(async () => {
    // Set up test vault
    process.env.KNOWLEDGE_KEEPER_DIR = "/tmp/test-vault";
  });

  afterEach(async () => {
    // Clean up
    delete process.env.KNOWLEDGE_KEEPER_DIR;
  });

  it("should work", async () => {
    // Test core logic from ../core.js
    const result = await someFunction();
    expect(result).toBeDefined();
  });
});
```

**Note**: Use `vitest`, NOT `node:test`. Old `node:test` test files have been removed.

```typescript
import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";

export function registerYourTool(server: McpServer): void {
  server.registerTool(
    "knowledge_your_tool",
    {
      title: "Your Tool",
      description: "What it does",
      inputSchema: z.object({
        param: z.string().describe("Parameter description"),
      }),
    },
    async (params) => {
      // Implementation
      return {
        content: [{ type: "text", text: "Result" }],
      };
    }
  );
}
```

## Guidelines

- **No API keys** — All features must work without external APIs
- **Local-first** — Data stays on the user's machine by default
- **TypeScript** — All code must be type-safe
- **Tests** — Add tests for new features (run `npm test`)
- **MIT License** — All contributions are MIT licensed

## Reporting Bugs

Open an issue at https://github.com/zsc-glitch/knowledge-keeper-mcp/issues

## License

By contributing, you agree your code will be licensed under MIT.

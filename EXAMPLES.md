# Knowledge Keeper MCP — Quick Examples

## Save Knowledge

```
You: Remember that we chose PostgreSQL over MongoDB for the user service because of ACID requirements.

AI: I'll save that decision for you.
→ knowledge_save(type="decision", title="Database choice for user service", 
    content="Chose PostgreSQL over MongoDB for the user service due to ACID transaction requirements", 
    tags=["database", "postgresql", "architecture"])
✅ Saved as decision_abc123
```

## Search Knowledge

```
You: Why did we choose PostgreSQL again?

AI: Let me search your knowledge base...
→ knowledge_hybrid_search(query="PostgreSQL choice", limit=5)

Found: "Database choice for user service"
→ Based on your records, you chose PostgreSQL over MongoDB for the user service 
  because of ACID transaction requirements.
```

## Build Knowledge Graph

```
You: Build a knowledge graph from my entries.

AI: I'll detect entities and build relationships...
→ knowledge_graph_build()

Detected 23 entities: PostgreSQL, MongoDB, User Service, ACID, REST API, React, TypeScript...
Created 15 relationships: User Service → uses → PostgreSQL, User Service → requires → ACID...
```

## Visualize Graph

```
You: Show me the knowledge graph.

AI: Here's your knowledge graph in Mermaid format:
→ knowledge_graph_visualize()

graph TD
    A[User Service] -->|uses| B[PostgreSQL]
    A -->|requires| C[ACID]
    D[API Gateway] -->|routes to| A
    E[React Frontend] -->|calls| D
    B -->|alternative| F[MongoDB]
```

## Review Old Knowledge

```
You: What should I review today?

AI: Checking your spaced repetition schedule...
→ knowledge_review()

📊 Review Schedule:
- 🔴 Overdue: "Database choice for user service" (30 days ago)
- 🟡 Due: "API rate limiting strategy" (7 days ago)  
- 🟢 Upcoming: "Auth flow design" (in 2 days)
```

## Analytics

```
You: How's my knowledge base doing?

AI: Let me pull the analytics...
→ knowledge_analytics_overview()

📊 Knowledge Base Overview:
- Total entries: 47
- Tags: 23 unique
- Health score: 82/100
- Oldest: 2026-01-15
- Newest: 2026-04-28

→ knowledge_analytics_insights()

🔍 Quality Insights:
- 3 orphan items (no tags, no links)
- 2 potential duplicates
- 5 stale items (>30 days)
- Connectivity: 75/100
- Coverage: 88/100

💡 Suggestions:
- Add tags to 3 orphan items
- Review 2 duplicate candidates
- Update 5 stale entries
```

## Cloud Sync (Pro)

```
You: Sync my knowledge to the cloud.

AI: Let me check your sync status first...
→ knowledge_sync_status()

📊 Sync Status:
- Last sync: 2 hours ago
- Pending changes: 5
- Synced items: 42

→ knowledge_sync(direction="full")

✅ Full sync complete:
- Pushed: 5 items
- Pulled: 2 items  
- Conflicts: 0
```

## Version History

```
You: What changed in the "Database choice" entry?

AI: Let me check the version history...
→ knowledge_versions(id="decision_abc123")

📋 Version History:
- v3 (2026-04-28): Added connection pool notes
- v2 (2026-04-20): Updated with replication strategy
- v1 (2026-04-15): Initial entry

→ knowledge_versions(id="decision_abc123", action="diff", from=1, to=3)

📝 Changes from v1 → v3:
+ Added: "Using PgBouncer for connection pooling"
+ Added: "Streaming replication for read replicas"  
~ Modified: Content expanded from 1 line to 3 paragraphs
```

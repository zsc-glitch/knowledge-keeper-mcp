"""
Knowledge Keeper Memory Provider for Hermes Agent

Gives Hermes persistent, searchable, connected memory — powered by
@zsc-glitch/knowledge-keeper-mcp (30 MCP tools, hybrid search,
knowledge graph, Obsidian compatible, zero API keys).
"""

import json
import logging
import os
import subprocess
import threading
from pathlib import Path
from typing import Any, Optional

from agent.memory_provider import MemoryProvider

logger = logging.getLogger("knowledge-keeper")

# ── Constants ──────────────────────────────────────────────────────────
DEFAULT_VAULT_PATH = Path.home() / ".knowledge-vault"
MCP_PACKAGE = "@zsc-glitch/knowledge-keeper-mcp"
MCP_COMMAND = "npx"
MCP_ARGS = ["-y", MCP_PACKAGE]


class KnowledgeKeeperProvider(MemoryProvider):
    """Memory provider backed by Knowledge Keeper MCP server."""

    def __init__(self):
        self._vault_path: Path = DEFAULT_VAULT_PATH
        self._session_id: str = ""
        self._hermes_home: str = ""
        self._proc: Optional[subprocess.Popen] = None
        self._request_id: int = 0
        self._initialized: bool = False

    # ── Lifecycle ──────────────────────────────────────────────────────

    @property
    def name(self) -> str:
        return "knowledge-keeper"

    def is_available(self) -> bool:
        """Available if vault exists or KK_VAULT_PATH is set."""
        vault = os.environ.get("KK_VAULT_PATH", str(self._vault_path))
        # Always available — will create vault on first save
        return True

    def initialize(self, session_id: str, **kwargs) -> None:
        self._session_id = session_id
        self._hermes_home = kwargs.get("hermes_home", str(Path.home() / ".hermes"))

        # Check for custom vault path
        custom = os.environ.get("KK_VAULT_PATH")
        if custom:
            self._vault_path = Path(custom)

        # Start MCP server subprocess (stdio)
        try:
            self._proc = subprocess.Popen(
                [MCP_COMMAND, *MCP_ARGS],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                env={**os.environ, "KK_VAULT_PATH": str(self._vault_path)},
            )
            # Initialize MCP connection
            self._send_request("initialize", {
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": {"name": "hermes-knowledge-keeper", "version": "1.0.0"},
            })
            # Send initialized notification
            self._send_notification("notifications/initialized", {})
            self._initialized = True
            logger.info("Knowledge Keeper MCP server initialized (vault: %s)", self._vault_path)
        except Exception as e:
            logger.error("Failed to start Knowledge Keeper MCP: %s", e)
            self._initialized = False

    def shutdown(self) -> None:
        """Clean up MCP subprocess."""
        if self._proc and self._proc.poll() is None:
            try:
                self._proc.terminate()
                self._proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self._proc.kill()
            logger.info("Knowledge Keeper MCP server shut down")

    # ── Tool Schemas ───────────────────────────────────────────────────

    def get_tool_schemas(self) -> list[dict]:
        """Expose key Knowledge Keeper tools to Hermes."""
        return [
            {
                "name": "knowledge_save",
                "description": "Save a knowledge entry with title, content, type, and tags. Types: concept, decision, todo, note, project.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "title": {"type": "string", "description": "Knowledge title"},
                        "content": {"type": "string", "description": "Knowledge content (Markdown)"},
                        "type": {
                            "type": "string",
                            "enum": ["concept", "decision", "todo", "note", "project"],
                            "description": "Entry type",
                            "default": "note",
                        },
                        "tags": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "Tags for categorization",
                        },
                    },
                    "required": ["title", "content"],
                },
            },
            {
                "name": "knowledge_search",
                "description": "Search knowledge entries by keyword. Returns matching entries sorted by relevance.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "query": {"type": "string", "description": "Search query"},
                        "limit": {"type": "number", "description": "Max results (default 10)"},
                    },
                    "required": ["query"],
                },
            },
            {
                "name": "knowledge_hybrid_search",
                "description": "Hybrid search combining BM25 keyword + TF-IDF semantic with RRF fusion. Best recall (R@5=97%+).",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "query": {"type": "string", "description": "Search query"},
                        "limit": {"type": "number", "description": "Max results (default 10)"},
                    },
                    "required": ["query"],
                },
            },
            {
                "name": "knowledge_get",
                "description": "Get a knowledge entry by ID.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "id": {"type": "string", "description": "Entry ID"},
                    },
                    "required": ["id"],
                },
            },
            {
                "name": "knowledge_update",
                "description": "Update an existing knowledge entry.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "id": {"type": "string", "description": "Entry ID"},
                        "title": {"type": "string", "description": "New title"},
                        "content": {"type": "string", "description": "New content"},
                        "tags": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "New tags",
                        },
                    },
                    "required": ["id"],
                },
            },
            {
                "name": "knowledge_delete",
                "description": "Delete a knowledge entry by ID.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "id": {"type": "string", "description": "Entry ID"},
                    },
                    "required": ["id"],
                },
            },
            {
                "name": "knowledge_tags",
                "description": "List all tags with counts, or manage tags on entries.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "action": {
                            "type": "string",
                            "enum": ["list", "add", "remove"],
                            "description": "Tag action (default: list)",
                        },
                        "tag": {"type": "string", "description": "Tag name (for add/remove)"},
                        "id": {"type": "string", "description": "Entry ID (for add/remove)"},
                    },
                },
            },
            {
                "name": "knowledge_review",
                "description": "Spaced repetition review — get entries due for review to reinforce memory.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "limit": {"type": "number", "description": "Max entries to review (default 5)"},
                    },
                },
            },
            {
                "name": "knowledge_graph_query",
                "description": "Query the knowledge graph for entities and relationships.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "query": {"type": "string", "description": "Entity or relation to search"},
                        "depth": {"type": "number", "description": "Graph traversal depth (default 2)"},
                    },
                },
            },
            {
                "name": "knowledge_analytics_overview",
                "description": "Get knowledge vault overview: entry counts, health score, recent activity.",
                "inputSchema": {
                    "type": "object",
                    "properties": {},
                },
            },
        ]

    # ── Tool Call Handling ─────────────────────────────────────────────

    def handle_tool_call(self, name: str, args: dict) -> str:
        """Route tool calls to MCP server."""
        if not self._initialized:
            return json.dumps({"error": "Knowledge Keeper not initialized"})

        try:
            result = self._send_request("tools/call", {
                "name": name,
                "arguments": args,
            })
            # Extract text content from MCP response
            content = result.get("content", [])
            texts = [c.get("text", "") for c in content if c.get("type") == "text"]
            return "\n".join(texts) if texts else json.dumps(result)
        except Exception as e:
            logger.error("Tool call %s failed: %s", name, e)
            return json.dumps({"error": str(e)})

    # ── Config ─────────────────────────────────────────────────────────

    def get_config_schema(self) -> list[dict]:
        """Minimal config — vault path is the only user-facing option."""
        return [
            {
                "key": "vault_path",
                "description": "Path to Knowledge Keeper vault (default: ~/.knowledge-vault)",
                "default": str(DEFAULT_VAULT_PATH),
                "required": False,
            },
        ]

    def save_config(self, values: dict, hermes_home: str) -> None:
        """Save vault path to config."""
        config_path = Path(hermes_home) / "knowledge-keeper.json"
        config_path.write_text(json.dumps(values, indent=2))
        if "vault_path" in values:
            self._vault_path = Path(values["vault_path"])

    # ── Hooks ──────────────────────────────────────────────────────────

    def system_prompt_block(self) -> str:
        """Inject Knowledge Keeper context into system prompt."""
        return (
            "## Knowledge Keeper\n"
            "You have persistent memory via Knowledge Keeper. "
            "Use `knowledge_save` to remember important information, "
            "`knowledge_hybrid_search` to recall relevant knowledge, "
            "and `knowledge_review` for spaced repetition.\n"
            f"Vault: {self._vault_path}"
        )

    def prefetch(self, query: str) -> Optional[str]:
        """Search relevant knowledge before each API call."""
        if not self._initialized:
            return None
        try:
            result = self._send_request("tools/call", {
                "name": "knowledge_hybrid_search",
                "arguments": {"query": query, "limit": 3},
            })
            content = result.get("content", [])
            texts = [c.get("text", "") for c in content if c.get("type") == "text"]
            if texts:
                return "## Relevant Knowledge\n" + "\n".join(texts)
        except Exception as e:
            logger.debug("Prefetch failed: %s", e)
        return None

    def sync_turn(self, user_content: str, assistant_content: str) -> None:
        """Non-blocking: could auto-extract knowledge from conversations."""
        # Future: auto-extract key insights and save
        pass

    def on_memory_write(self, action: str, target: str, content: str) -> None:
        """Mirror built-in memory writes to Knowledge Keeper."""
        if not self._initialized:
            return
        try:
            self._send_request("tools/call", {
                "name": "knowledge_save",
                "arguments": {
                    "title": f"hermes:{action}:{target}",
                    "content": content,
                    "type": "note",
                    "tags": ["hermes", action],
                },
            })
        except Exception as e:
            logger.debug("Memory mirror failed: %s", e)

    # ── MCP Communication ──────────────────────────────────────────────

    def _send_request(self, method: str, params: dict) -> dict:
        """Send JSON-RPC request to MCP subprocess."""
        if not self._proc or self._proc.poll() is not None:
            raise RuntimeError("MCP server not running")

        self._request_id += 1
        request = {
            "jsonrpc": "2.0",
            "id": self._request_id,
            "method": method,
            "params": params,
        }

        msg = json.dumps(request) + "\n"
        self._proc.stdin.write(msg.encode())
        self._proc.stdin.flush()

        # Read response line
        response_line = self._proc.stdout.readline().decode()
        if not response_line:
            raise RuntimeError("MCP server closed connection")

        response = json.loads(response_line)
        if "error" in response:
            raise RuntimeError(f"MCP error: {response['error']}")
        return response.get("result", {})

    def _send_notification(self, method: str, params: dict) -> None:
        """Send JSON-RPC notification (no response expected)."""
        if not self._proc:
            return
        notification = {
            "jsonrpc": "2.0",
            "method": method,
            "params": params,
        }
        msg = json.dumps(notification) + "\n"
        self._proc.stdin.write(msg.encode())
        self._proc.stdin.flush()


# ── Entry Point ────────────────────────────────────────────────────────

def register(ctx) -> None:
    """Called by Hermes memory plugin discovery system."""
    ctx.register_memory_provider(KnowledgeKeeperProvider())

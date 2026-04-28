"""
Knowledge Keeper CLI commands for Hermes Agent

Adds: hermes knowledge-keeper status | stats | reindex
"""

import argparse
import json
import subprocess
import sys
from pathlib import Path


def cmd_status(args):
    """Show Knowledge Keeper vault status."""
    vault = Path(args.vault or Path.home() / ".knowledge-vault")
    
    if not vault.exists():
        print(f"❌ Vault not found: {vault}")
        print(f"   Run a knowledge_save to create it automatically.")
        return 1
    
    # Count entries by type
    types = {"concepts": 0, "decisions": 0, "todos": 0, "notes": 0, "projects": 0}
    total = 0
    for type_dir, count_key in types.items():
        d = vault / type_dir
        if d.exists():
            files = list(d.glob("*.md"))
            types[type_dir] = len(files)
            total += len(files)
    
    # Check index
    index_path = vault / "index.json"
    index_ok = index_path.exists()
    
    # Check BM25
    bm25_path = vault / "bm25-index.json"
    bm25_ok = bm25_path.exists()
    
    # Check links
    links_path = vault / "links.json"
    links_ok = links_path.exists()
    link_count = 0
    if links_ok:
        try:
            data = json.loads(links_path.read_text())
            link_count = len(data.get("links", []))
        except Exception:
            pass
    
    print(f"🧠 Knowledge Keeper — Vault Status")
    print(f"   Path: {vault}")
    print(f"   Total entries: {total}")
    print(f"   Concepts: {types['concepts']} | Decisions: {types['decisions']} | Todos: {types['todos']}")
    print(f"   Notes: {types['notes']} | Projects: {types['projects']}")
    print(f"   Links: {link_count}")
    print(f"   Index: {'✅' if index_ok else '❌'} | BM25: {'✅' if bm25_ok else '❌'}")
    
    return 0


def cmd_stats(args):
    """Show detailed analytics."""
    try:
        result = subprocess.run(
            ["npx", "-y", "@zsc-glitch/knowledge-keeper-mcp"],
            input=json.dumps({
                "jsonrpc": "2.0",
                "id": 1,
                "method": "tools/call",
                "params": {"name": "knowledge_analytics_overview", "arguments": {}},
            }) + "\n",
            capture_output=True,
            text=True,
            timeout=30,
        )
        if result.stdout:
            response = json.loads(result.stdout.strip())
            content = response.get("result", {}).get("content", [])
            for c in content:
                if c.get("type") == "text":
                    print(c["text"])
            return 0
    except Exception as e:
        print(f"❌ Failed to get stats: {e}")
    return 1


def main():
    parser = argparse.ArgumentParser(
        prog="hermes knowledge-keeper",
        description="Knowledge Keeper MCP management commands",
    )
    parser.add_argument("--vault", help="Vault path (default: ~/.knowledge-vault)")
    
    subparsers = parser.add_subparsers(dest="command")
    subparsers.add_parser("status", help="Show vault status")
    subparsers.add_parser("stats", help="Show detailed analytics")
    
    args = parser.parse_args()
    
    if args.command == "status":
        return cmd_status(args)
    elif args.command == "stats":
        return cmd_stats(args)
    else:
        parser.print_help()
        return 0


if __name__ == "__main__":
    sys.exit(main() or 0)

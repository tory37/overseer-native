## Persistent Memory (Vault)
- **Central Vault:** ~/vault/
- **Session Logs:** Read the latest files in ~/vault/logs/ at the start of a session to resume state.
- **Architecture Notes:** Check ~/vault/permanent/ for long-term decisions.
- **Session End:** Always write a summary of work, decisions, and pending tasks to a new log in ~/vault/logs/YYYY-MM-DD-session-id.md.

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep — these traverse the graph's EXTRACTED + INFERRED edges instead of scanning files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)

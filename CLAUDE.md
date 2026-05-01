## Configuration & Workflow

- **Disabled Skills:** Do NOT use the `using-git-worktrees` skill. It is considered too token-heavy and should be avoided.

## Keyboard Shortcuts

When adding any new user-facing feature, explicitly decide whether it warrants a keyboard shortcut. If yes, implement the shortcut alongside the feature — not as a follow-up. Add it to `KeybindingAction`, `DEFAULT_KEYBINDINGS`, and the shortcuts modal in the same PR.

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep — these traverse the graph's EXTRACTED + INFERRED edges instead of scanning files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)

## Persistent Memory (Vault)
- **Central Vault:** ~/vault/
- **Session Logs:** Read the latest files in ~/vault/logs/ at the start of a session to resume state.
- **Architecture Notes:** Check ~/vault/permanent/ for long-term decisions.
- **Session End:** Always write a summary of work, decisions, and pending tasks to a new log in ~/vault/logs/YYYY-MM-DD-session-id.md.

## Automation
- **Sync Chats:** Run `bash ~/vault/scripts/sync_claude_obsidian.sh` to import recent conversations into the vault.
- **Export Graph:** Run `python3 ~/vault/scripts/export_graph_to_obsidian.py . ~/vault/graphify/overseer` to update the Obsidian visualization.

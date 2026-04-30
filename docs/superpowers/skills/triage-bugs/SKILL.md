---
name: triage-bugs
description: Use when the user asks to look at open bugs or triage issues. Fetches GitHub issues and walks through fixing them one by one.
---

<SUBAGENT-STOP>
If you were dispatched as a subagent to execute a specific task, skip this skill.
</SUBAGENT-STOP>

# Bug Triage Pipeline

You are executing the Bug Triage Pipeline. Follow these phases exactly in order.

## Phase 1: Trigger & Verify
1. Verify that the GitHub CLI (`gh`) is available by running `gh auth status`.
2. If `gh` is not installed or authenticated, tell the user to install/authenticate it and stop.

## Phase 2: Fetch
1. Execute `gh issue list --state open --json number,title,labels` using the `run_shell_command` tool.
2. Format the output into a clean, numbered list.
3. If there are no open issues, inform the user and stop.

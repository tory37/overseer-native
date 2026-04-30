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

## Phase 3: Selection
1. Present the formatted list of issues to the user.
2. Ask the user to select an issue by its number using the `ask_user` tool (or standard prompt). Wait for their response.

## Phase 4: Planning
1. Once an issue is selected, fetch the full details and comments using `gh issue view <number> --comments`.
2. Analyze the project codebase in relation to the issue description to locate the problem.
3. You MUST invoke the `writing-plans` skill to formalize the implementation plan. Do NOT start coding until the plan is approved.

## Phase 5: Execution & Verification
1. Implement the fix following the approved plan.
2. Utilize the `test-driven-development` and `systematic-debugging` skills as required.
3. Verify the fix locally by running the relevant tests or build commands.
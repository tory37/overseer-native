# Bug Triage Pipeline (triage-bugs skill) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a Superpowers skill that orchestrates the fetching, selection, and fixing of GitHub issues one by one.

**Architecture:** A single markdown file (`docs/superpowers/skills/triage-bugs/SKILL.md`) containing explicit instructions for the AI on how to interact with the GitHub CLI and coordinate with other skills (like `writing-plans` and `systematic-debugging`).

**Tech Stack:** Markdown, GitHub CLI (`gh`).

---

### Task 1: Create Skill Framework and Fetch Phase

**Files:**
- Create: `docs/superpowers/skills/triage-bugs/SKILL.md`

- [ ] **Step 1: Write the skill metadata and Trigger/Fetch phase instructions**

```markdown
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
```

- [ ] **Step 2: Save the file**
Write the above content to `docs/superpowers/skills/triage-bugs/SKILL.md`.

- [ ] **Step 3: Verify execution capability**
Run `gh --version` to ensure the environment supports fetching issues (basic sanity check).

- [ ] **Step 4: Commit**
```bash
git add docs/superpowers/skills/triage-bugs/SKILL.md
git commit -m "feat(skills): add initial triage-bugs skill framework and fetch phase"
```

### Task 2: Implement Selection, Planning, and Execution Phases

**Files:**
- Modify: `docs/superpowers/skills/triage-bugs/SKILL.md`

- [ ] **Step 1: Append Phase 3, 4, and 5 instructions**

```markdown
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
```

- [ ] **Step 2: Save the file**
Append the above content to `docs/superpowers/skills/triage-bugs/SKILL.md`.

- [ ] **Step 3: Commit**
```bash
git add docs/superpowers/skills/triage-bugs/SKILL.md
git commit -m "feat(skills): add planning and execution phases to triage-bugs"
```

### Task 3: Implement Wrap-up Phase and Error Handling

**Files:**
- Modify: `docs/superpowers/skills/triage-bugs/SKILL.md`

- [ ] **Step 1: Append Phase 6 and Error Handling instructions**

```markdown
## Phase 6: Wrap-up
1. Ask the user to verify the fix locally.
2. Once the user verifies the fix, ask if they want you to close the issue. If yes, run `gh issue close <number>`.
3. Ask the user if they want to pull the list again to select another bug, or exit the triage loop.

## General Error Handling
- If any `gh` command fails (e.g., rate limits, network issues), inform the user and pause the pipeline.
- Do not skip steps or make assumptions about the codebase without verifying through search tools.
```

- [ ] **Step 2: Save the file**
Append the above content to `docs/superpowers/skills/triage-bugs/SKILL.md`.

- [ ] **Step 3: Commit**
```bash
git add docs/superpowers/skills/triage-bugs/SKILL.md
git commit -m "feat(skills): add wrap-up phase and error handling to triage-bugs"
```
# Bug Triage Pipeline (triage-bugs skill)

## Overview
A workflow pipeline for iteratively fetching, planning, and fixing open GitHub issues one by one. This pipeline will be implemented as a new Superpowers skill (`triage-bugs`), seamlessly integrating with the existing `using-superpowers` workflow.

## Architecture & Components
The feature consists of a single markdown skill file (`docs/superpowers/skills/triage-bugs/SKILL.md`) that acts as an orchestration rule set for the AI.

## Workflow / Data Flow
1. **Trigger Phase:** The user invokes the skill (e.g., via `activate_skill` or by asking to fix bugs). The skill verifies the availability of the `gh` CLI.
2. **Fetch Phase:** The AI executes `gh issue list --state open --json number,title,labels` and presents a numbered, formatted list of open bugs to the user.
3. **Selection Phase:** The AI halts execution and waits for the user to select an issue number.
4. **Planning Phase:**
   - The AI fetches detailed issue context using `gh issue view <number> --comments`.
   - The AI analyzes the codebase based on the issue description.
   - The AI invokes the `writing-plans` skill to formalize an implementation plan.
5. **Execution & Verification Phase:**
   - The AI implements the fix following the plan.
   - The AI must use `test-driven-development` and `systematic-debugging` as required to ensure correctness.
   - The AI verifies the fix by running relevant tests.
6. **Wrap-up Phase:**
   - The AI prompts the user to verify the fix locally.
   - Once verified, the AI offers to close the issue via `gh issue close <number>`.
   - The AI asks if the user wishes to return to the Fetch Phase to select another bug or exit the loop.

## Error Handling
- If `gh` is not installed or not authenticated, the skill will instruct the user to install/authenticate it before proceeding.
- If no open issues exist, the skill will report this and gracefully exit.

## Testing & Verification
- The pipeline itself is tested by invoking the skill and ensuring it correctly fetches issues and pauses for selection.
- Individual fixes are verified via the project's existing testing infrastructure (e.g., `npm test`).
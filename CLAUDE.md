## Configuration & Workflow

- **Disabled Skills:** Do NOT use the `using-git-worktrees` skill. It is considered too token-heavy and should be avoided.

## Keyboard Shortcuts

When adding any new user-facing feature, explicitly decide whether it warrants a keyboard shortcut. If yes, implement the shortcut alongside the feature — not as a follow-up. Add it to `KeybindingAction`, `DEFAULT_KEYBINDINGS`, and the shortcuts modal in the same PR.

**Project Context**
  * Architecture Docs: \~/vault/graphify/overseer  
  * Working Context: \~/vault/logs/  

export const CLAUDE_WRAPPER = `#!/bin/bash
# Diagnostic log
LOG_FILE="$OVERSEER_SESSION_DIR/wrapper.log"
echo "[$(date)] Claude wrapper called with: $@" >> "$LOG_FILE"

# Find the real 'claude' by skipping the overseer bin in the PATH
REAL_CLAUDE=$(PATH=$(echo "$PATH" | sed -e "s|$OVERSEER_SESSION_DIR/bin:||g") which claude)
if [ -z "$REAL_CLAUDE" ]; then
    echo "Error: 'claude' not found in PATH" >&2
    echo "[$(date)] Error: 'claude' not found in PATH" >> "$LOG_FILE"
    exit 1
fi

PERSONA=$(node -e "const fs=require('fs'); const path=require('path'); try { const ctx=JSON.parse(fs.readFileSync(path.join(process.env.OVERSEER_SESSION_DIR, 'context.json'))); process.stdout.write(ctx.persona || ''); } catch(e) {}")

if [ -n "$PERSONA" ]; then
    echo "[$(date)] Injecting persona: \${PERSONA:0:50}..." >> "$LOG_FILE"
    exec "$REAL_CLAUDE" --system-prompt "$PERSONA" "$@"
else
    echo "[$(date)] No persona found, running real claude directly" >> "$LOG_FILE"
    exec "$REAL_CLAUDE" "$@"
fi
`

export const GEMINI_WRAPPER = `#!/bin/bash
# Diagnostic log
LOG_FILE="$OVERSEER_SESSION_DIR/wrapper.log"
echo "[$(date)] Gemini wrapper called with: $@" >> "$LOG_FILE"

REAL_GEMINI=$(PATH=$(echo "$PATH" | sed -e "s|$OVERSEER_SESSION_DIR/bin:||g") which gemini)
if [ -z "$REAL_GEMINI" ]; then
    echo "Error: 'gemini' not found in PATH" >&2
    echo "[$(date)] Error: 'gemini' not found in PATH" >> "$LOG_FILE"
    exit 1
fi

PERSONA=$(node -e "const fs=require('fs'); const path=require('path'); try { const ctx=JSON.parse(fs.readFileSync(path.join(process.env.OVERSEER_SESSION_DIR, 'context.json'))); process.stdout.write(ctx.persona || ''); } catch(e) {}")

# For Gemini, -i and -p are mutually exclusive. 
# If -p or --prompt is present, we don't use -i.
HAS_PROMPT=0
for arg in "$@"; do
    if [[ "$arg" == "-p" ]] || [[ "$arg" == "--prompt" ]]; then
        HAS_PROMPT=1
        break
    fi
done

if [ -n "$PERSONA" ]; then
    echo "[$(date)] Injecting persona into Gemini: \${PERSONA:0:50}..." >> "$LOG_FILE"
    if [ $HAS_PROMPT -eq 1 ]; then
        # Non-interactive: we can't easily inject system prompt via flags for gemini-cli
        # So we just run it and hope for the best, or prepend to positional args if no -p
        exec "$REAL_GEMINI" "$@"
    else
        # Interactive: use -i for initial system instruction
        exec "$REAL_GEMINI" -i "system: $PERSONA" "$@"
    fi
else
    echo "[$(date)] No persona found, running real gemini directly" >> "$LOG_FILE"
    exec "$REAL_GEMINI" "$@"
fi
`

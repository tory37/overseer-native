export const CLAUDE_WRAPPER = `#!/bin/bash
# Find the real 'claude' by skipping the overseer bin in the PATH
REAL_CLAUDE=$(PATH=$(echo "$PATH" | sed -e "s|$OVERSEER_SESSION_DIR/bin:||g") which claude)
if [ -z "$REAL_CLAUDE" ]; then
    echo "Error: 'claude' not found in PATH" >&2
    exit 1
fi
PERSONA=$(python3 -c "import json, os; d=json.load(open(os.path.join(os.environ['OVERSEER_SESSION_DIR'], 'context.json'))); print(d.get('persona', ''))")
exec "$REAL_CLAUDE" --system-prompt "$PERSONA" "$@"
`

export const GEMINI_WRAPPER = `#!/bin/bash
REAL_GEMINI=$(PATH=$(echo "$PATH" | sed -e "s|$OVERSEER_SESSION_DIR/bin:||g") which gemini)
if [ -z "$REAL_GEMINI" ]; then
    echo "Error: 'gemini' not found in PATH" >&2
    exit 1
fi
PERSONA=$(python3 -c "import json, os; d=json.load(open(os.path.join(os.environ['OVERSEER_SESSION_DIR'], 'context.json'))); print(d.get('persona', ''))")
exec "$REAL_GEMINI" -i "system: $PERSONA" "$@"
`

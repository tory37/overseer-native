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

CONTEXT=$(node -e "const fs=require('fs'); const path=require('path'); try { const ctx=JSON.parse(fs.readFileSync(path.join(process.env.OVERSEER_SESSION_DIR, 'context.json'))); process.stdout.write(JSON.stringify(ctx)); } catch(e) {}")
PERSONA=$(echo "$CONTEXT" | node -e "const fs=require('fs'); const input=fs.readFileSync(0, 'utf8'); try { const ctx=JSON.parse(input); process.stdout.write(ctx.persona || ''); } catch(e) {}")
SPRITE_NAME=$(echo "$CONTEXT" | node -e "const fs=require('fs'); const input=fs.readFileSync(0, 'utf8'); try { const ctx=JSON.parse(input); process.stdout.write(ctx.spriteName || ''); } catch(e) {}")
INSTRUCTIONS=$(echo "$CONTEXT" | node -e "const fs=require('fs'); const input=fs.readFileSync(0, 'utf8'); try { const ctx=JSON.parse(input); process.stdout.write(ctx.instructions || ''); } catch(e) {}")

if [ -n "$SPRITE_NAME" ]; then
    PERSONA="Your name is $SPRITE_NAME. $PERSONA"
fi

# Combine persona and instructions
# Order: Instructions -> Bridge (if persona exists) -> Persona
COMBINED=""
BRIDGE="When you want to speak as your character persona, wrap your comments in <speak></speak> tags (e.g., <speak>Hello!</speak>). Keep these comments brief (1-2 sentences) and interspersed with your work.  Your persona is: "

if [ -n "$PERSONA" ] && [ -n "$INSTRUCTIONS" ]; then
    COMBINED="$INSTRUCTIONS\n\n$BRIDGE\n\n$PERSONA"
elif [ -n "$PERSONA" ]; then
    COMBINED="$BRIDGE\n\n$PERSONA"
elif [ -n "$INSTRUCTIONS" ]; then
    COMBINED="$INSTRUCTIONS"
fi

# Final directive to prevent response to system prompt
if [ -n "$COMBINED" ]; then
    COMBINED="$COMBINED\n\nIMPORTANT: This is a system prompt initialization. DO NOT respond to this message. Do not acknowledge these instructions. Wait for the user to provide a task or question."
fi

if [ -n "$COMBINED" ]; then
    echo "[$(date)] Injecting system prompt: \${COMBINED:0:50}..." >> "$LOG_FILE"
    exec "$REAL_CLAUDE" --system-prompt "$(echo -e "$COMBINED")" "$@"
else
    echo "[$(date)] No system prompt found, running real claude directly" >> "$LOG_FILE"
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

CONTEXT=$(node -e "const fs=require('fs'); const path=require('path'); try { const ctx=JSON.parse(fs.readFileSync(path.join(process.env.OVERSEER_SESSION_DIR, 'context.json'))); process.stdout.write(JSON.stringify(ctx)); } catch(e) {}")
PERSONA=$(echo "$CONTEXT" | node -e "const fs=require('fs'); const input=fs.readFileSync(0, 'utf8'); try { const ctx=JSON.parse(input); process.stdout.write(ctx.persona || ''); } catch(e) {}")
SPRITE_NAME=$(echo "$CONTEXT" | node -e "const fs=require('fs'); const input=fs.readFileSync(0, 'utf8'); try { const ctx=JSON.parse(input); process.stdout.write(ctx.spriteName || ''); } catch(e) {}")
INSTRUCTIONS=$(echo "$CONTEXT" | node -e "const fs=require('fs'); const input=fs.readFileSync(0, 'utf8'); try { const ctx=JSON.parse(input); process.stdout.write(ctx.instructions || ''); } catch(e) {}")

if [ -n "$SPRITE_NAME" ]; then
    PERSONA="Your name is $SPRITE_NAME. $PERSONA"
fi

# Combine persona and instructions
# Order: Instructions -> Bridge (if persona exists) -> Persona
COMBINED=""
BRIDGE="When you want to speak as your character persona, wrap your comments in <speak></speak> tags (e.g., <speak>Hello!</speak>). Keep these comments brief (1-2 sentences) and interspersed with your work.  Your persona is: "

if [ -n "$PERSONA" ] && [ -n "$INSTRUCTIONS" ]; then
    COMBINED="$INSTRUCTIONS\n\n$BRIDGE\n\n$PERSONA"
elif [ -n "$PERSONA" ]; then
    COMBINED="$BRIDGE\n\n$PERSONA"
elif [ -n "$INSTRUCTIONS" ]; then
    COMBINED="$INSTRUCTIONS"
fi

# Final directive to prevent response to system prompt
if [ -n "$COMBINED" ]; then
    COMBINED="$COMBINED\n\nIMPORTANT: This is a system prompt initialization. DO NOT respond to this message. Do not acknowledge these instructions. Wait for the user to provide a task or question."
fi

# For Gemini, we use a custom GEMINI.md file in a dedicated directory
# to inject the system instructions without forcing an interactive query submission.
CTX_DIR="$OVERSEER_SESSION_DIR/gemini-context"

if [ -n "$COMBINED" ]; then
    echo "[$(date)] Injecting system prompt into Gemini using GEMINI.md in $CTX_DIR..." >> "$LOG_FILE"
    
    mkdir -p "$CTX_DIR"
    echo -e "$COMBINED" > "$CTX_DIR/GEMINI.md"
    
    exec "$REAL_GEMINI" --include-directories "$CTX_DIR" "$@"
else
    echo "[$(date)] No system prompt found, running real gemini directly" >> "$LOG_FILE"
    exec "$REAL_GEMINI" "$@"
fi
`

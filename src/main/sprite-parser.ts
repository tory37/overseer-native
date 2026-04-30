export interface ParsedSpriteEvent {
  type: 'speech'
  text: string
}

const SPEAK_REGEX = /<speak>([\s\S]*?)<\/speak>/g

export function parseSpriteSpeech(chunk: string): ParsedSpriteEvent[] {
  // Ignore chunks that look like they contain the system prompt instructions.
  // This prevents extracting example tags from the LLM instructions.
  if (chunk.includes('When you want to speak as your character persona')) {
    return []
  }

  const events: ParsedSpriteEvent[] = []
  let match: RegExpExecArray | null
  SPEAK_REGEX.lastIndex = 0
  while ((match = SPEAK_REGEX.exec(chunk)) !== null) {
    const text = match[1].trim()
    if (text) events.push({ type: 'speech', text })
  }
  return events
}

export interface ParsedSpriteEvent {
  type: 'speech'
  text: string
}

const SPEAK_REGEX = /<speak>([\s\S]*?)<\/speak>/g

function decodeEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&');
}

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
    if (text) {
      events.push({ 
        type: 'speech', 
        text: decodeEntities(text) 
      })
    }
  }
  return events
}

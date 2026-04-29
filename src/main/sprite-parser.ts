export interface ParsedSpriteEvent {
  type: 'speech'
  text: string
}

const SPEAK_REGEX = /<speak>([\s\S]+?)<\/speak>/g

export function parseSpriteSpeech(chunk: string): ParsedSpriteEvent[] {
  const events: ParsedSpriteEvent[] = []
  let match: RegExpExecArray | null
  SPEAK_REGEX.lastIndex = 0
  while ((match = SPEAK_REGEX.exec(chunk)) !== null) {
    const text = match[1].trim()
    if (text) events.push({ type: 'speech', text })
  }
  return events
}

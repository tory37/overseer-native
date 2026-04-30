export interface ParsedSpriteEvent {
  type: 'speech'
  text: string
}

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

function stripAnsi(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\x1B\[[0-9;]*[JKmsu]/g, '');
}

export class SpriteParser {
  private buffer = ''

  parse(chunk: string): ParsedSpriteEvent[] {
    // Ignore chunks that look like they contain the system prompt instructions.
    // This prevents extracting example tags from the LLM instructions.
    if (chunk.includes('When you want to speak as your character persona')) {
      return []
    }

    this.buffer += chunk
    const events: ParsedSpriteEvent[] = []

    while (true) {
      const startIdx = this.buffer.indexOf('<speak>')
      if (startIdx === -1) {
        // No start tag. 
        // Keep only the very end in case a tag was split like "<spe" | "ak>"
        this.buffer = this.buffer.slice(-20)
        break
      }

      const endIdx = this.buffer.indexOf('</speak>', startIdx)
      if (endIdx === -1) {
        // Start tag found but no end tag yet.
        // Discard everything before the start tag to keep buffer clean.
        this.buffer = this.buffer.slice(startIdx)
        
        // Safety: if the buffer grows too large without an end tag, something is wrong.
        if (this.buffer.length > 10000) {
          this.buffer = ''
        }
        break
      }

      // Found a complete tag
      const rawText = this.buffer.slice(startIdx + 7, endIdx).trim()
      if (rawText) {
        events.push({ 
          type: 'speech', 
          text: decodeEntities(stripAnsi(rawText))
        })
      }
      
      // Remove the processed tag and anything before it, then continue
      this.buffer = this.buffer.slice(endIdx + 8)
    }

    return events
  }
}

// Backward compatibility for simple cases if needed, but we should use the class.
export function parseSpriteSpeech(chunk: string): ParsedSpriteEvent[] {
  return new SpriteParser().parse(chunk)
}

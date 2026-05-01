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
  return text.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
}

export class SpriteParser {
  private buffer = ''

  parse(chunk: string): ParsedSpriteEvent[] {
    this.buffer += chunk
    
    // Safety: if the buffer grows too large, something is wrong.
    if (this.buffer.length > 50000) {
      this.buffer = this.buffer.slice(-1000)
    }

    // Ignore if the buffer currently contains the system prompt instructions.
    // This prevents extracting example tags from the LLM instructions.
    if (this.buffer.includes('When you want to speak as your character persona')) {
      // If we see the instructions, clear the buffer after them to avoid capturing examples
      const idx = this.buffer.lastIndexOf('Your persona is:')
      if (idx !== -1) {
        this.buffer = this.buffer.slice(idx)
      }
      return []
    }

    const events: ParsedSpriteEvent[] = []

    while (true) {
      const endIdx = this.buffer.indexOf('</speak>')
      if (endIdx === -1) {
        // No end tag yet. 
        // We only care about text starting from the LAST <speak>
        const lastStartIdx = this.buffer.lastIndexOf('<speak>')
        if (lastStartIdx !== -1) {
          this.buffer = this.buffer.slice(lastStartIdx)
        } else if (this.buffer.length > 200) {
          // No start tag either, keep only a small tail to catch split tags
          this.buffer = this.buffer.slice(-100)
        }
        break
      }

      // Found an end tag. Look for the closest start tag BEFORE it.
      const startIdx = this.buffer.lastIndexOf('<speak>', endIdx)
      if (startIdx === -1) {
        // Found </speak> but no <speak> before it. Discard and continue.
        this.buffer = this.buffer.slice(endIdx + 8)
        continue
      }

      // Found a complete tag pair
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

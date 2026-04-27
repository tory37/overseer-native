import fs from 'fs'

export class ScrollbackManager {
  constructor(private logPath: string) {}

  append(data: Buffer): void {
    try {
      fs.appendFileSync(this.logPath, data)
    } catch (err) {
      console.warn(`[scrollback] write failed for ${this.logPath}:`, err)
    }
  }

  read(): Buffer | null {
    if (!fs.existsSync(this.logPath)) return null
    return fs.readFileSync(this.logPath)
  }
}

import fs from 'fs'
import path from 'path'
import os from 'os'

export class ConfigService {
  private baseDir: string

  constructor(baseDir?: string) {
    this.baseDir = baseDir || path.join(os.homedir(), '.overseer')
  }

  async read<T>(filename: string): Promise<T | null> {
    const p = path.join(this.baseDir, filename)
    try {
      const raw = await fs.promises.readFile(p, 'utf8')
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  }

  async write<T>(filename: string, data: T): Promise<void> {
    const p = path.join(this.baseDir, filename)
    await fs.promises.mkdir(path.dirname(p), { recursive: true })
    await fs.promises.writeFile(p, JSON.stringify(data, null, 2), 'utf8')
  }
}

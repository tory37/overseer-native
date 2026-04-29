import fs from 'fs'
import path from 'path'
import os from 'os'
import type { Session } from '../../renderer/types/ipc'

export class SessionRegistry {
  private sessions: Session[] = []
  private filePath: string

  constructor(sessionsDir?: string) {
    const defaultDir = path.join(os.homedir(), '.overseer', 'sessions')
    const finalDir = sessionsDir || defaultDir
    fs.mkdirSync(finalDir, { recursive: true })
    this.filePath = path.join(finalDir, 'registry.json')
    this.sessions = this.load()
  }

  list(): Session[] {
    return [...this.sessions]
  }

  add(session: Session): void {
    this.sessions.push(session)
    this.save()
  }

  remove(id: string): void {
    this.sessions = this.sessions.filter(s => s.id !== id)
    this.save()
  }

  private load(): Session[] {
    if (!fs.existsSync(this.filePath)) return []
    try {
      return JSON.parse(fs.readFileSync(this.filePath, 'utf8'))
    } catch {
      return []
    }
  }

  save(): void {
    fs.writeFileSync(this.filePath, JSON.stringify(this.sessions, null, 2))
  }
}

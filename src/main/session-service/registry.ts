import fs from 'fs'
import path from 'path'
import type { Session } from '../../renderer/types/ipc'

export class SessionRegistry {
  private sessions: Session[] = []
  private filePath: string

  constructor(sessionsDir: string = `${process.env.HOME}/.overseer/sessions`) {
    fs.mkdirSync(sessionsDir, { recursive: true })
    this.filePath = path.join(sessionsDir, 'registry.json')
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

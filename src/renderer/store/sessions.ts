import { create } from 'zustand'
import type { Session, CreateSessionOptions } from '../types/ipc'

interface SessionStore {
  sessions: Session[]
  activeSessionId: string | null
  load: () => Promise<void>
  createSession: (options: CreateSessionOptions) => Promise<Session>
  killSession: (id: string) => Promise<void>
  setActive: (id: string) => void
}

export const useSessionStore = create<SessionStore>((set) => ({
  sessions: [],
  activeSessionId: null,

  load: async () => {
    if (!window.overseer?.listSessions) return
    const sessions = await window.overseer.listSessions()
    set({ sessions, activeSessionId: sessions[0]?.id ?? null })
  },

  createSession: async (options: CreateSessionOptions) => {
    if (!window.overseer?.createSession) throw new Error('overseer not available')
    const session = await window.overseer.createSession(options)
    set(state => ({
      sessions: [...state.sessions, session],
      activeSessionId: session.id,
    }))
    return session
  },

  killSession: async (id: string) => {
    if (!window.overseer?.killSession) return
    await window.overseer.killSession(id)
    set(state => {
      const sessions = state.sessions.filter(s => s.id !== id)
      const activeSessionId =
        state.activeSessionId === id ? (sessions[0]?.id ?? null) : state.activeSessionId
      return { sessions, activeSessionId }
    })
  },

  setActive: (id: string) => set({ activeSessionId: id }),
}))

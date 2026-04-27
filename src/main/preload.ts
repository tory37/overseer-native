import { contextBridge } from 'electron'

contextBridge.exposeInMainWorld('overseer', {})

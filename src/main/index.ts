import { app, BrowserWindow } from 'electron'
import path from 'path'
import os from 'os'
import { SessionService } from './session-service/index'
import { SyncService } from './services/sync-service'
import { registerIpcHandlers } from './ipc-handlers'

const isDev = process.env.NODE_ENV === 'development'
const baseDir = isDev 
  ? path.join(os.homedir(), '.overseer-dev')
  : path.join(os.homedir(), '.overseer')

let mainWindow: BrowserWindow | null = null
const sessionService = new SessionService(baseDir)
const syncService = new SyncService(baseDir)

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  registerIpcHandlers(sessionService, syncService, () => mainWindow, baseDir)
  sessionService.restoreAll()

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../renderer/index.html'))
  }

  mainWindow.on('closed', () => { mainWindow = null })
}

app.whenReady().then(createWindow)
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })

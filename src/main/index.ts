import { app, BrowserWindow } from 'electron'
import path from 'path'
import os from 'os'
import { loadShellEnv } from './services/shell-env'
import { SessionService } from './session-service/index'

// Load shell environment before initializing services
loadShellEnv()

import { SyncService } from './services/sync-service'
import { UpdateService } from './services/update-service'
import { registerIpcHandlers } from './ipc-handlers'

const isDev = !app.isPackaged
const baseDir = isDev 
  ? path.join(os.homedir(), '.overseer-dev')
  : path.join(os.homedir(), '.overseer')

process.env.OVERSEER_VERSION = app.getVersion()
process.env.OVERSEER_IS_DEV = isDev ? 'true' : 'false'

let mainWindow: BrowserWindow | null = null
const sessionService = new SessionService(baseDir)
const syncService = new SyncService(baseDir)
const updateService = new UpdateService(() => mainWindow)

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

  sessionService.restoreAll()

  const devServerUrl = process.env.VITE_DEV_SERVER_URL
  if (isDev && devServerUrl) {
    mainWindow.loadURL(devServerUrl)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../renderer/index.html'))
    if (isDev) {
      mainWindow.webContents.openDevTools()
    }
  }

  mainWindow.on('closed', () => { mainWindow = null })
}

app.whenReady().then(() => {
  // Register IPC handlers and init update service exactly once — process-level, not window-level.
  // Previously inside createWindow(), which caused a fatal crash on macOS: closing all windows
  // keeps the app alive in the Dock, and clicking the icon fires 'activate' → createWindow()
  // again → ipcMain.handle() called twice → "Attempted to register a second handler" error.
  registerIpcHandlers(sessionService, syncService, updateService, () => mainWindow, baseDir, isDev)
  updateService.init()
  createWindow()
})
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })

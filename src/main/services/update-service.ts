import { autoUpdater } from 'electron-updater'
import { BrowserWindow } from 'electron'
import { IPC, UpdateStatus } from '../../renderer/types/ipc'

export class UpdateService {
  private status: UpdateStatus = { type: 'idle' }

  constructor(private getWindow: () => BrowserWindow | null) {
    autoUpdater.autoDownload = true
    autoUpdater.autoInstallOnAppQuit = true

    autoUpdater.on('checking-for-update', () => this.setStatus({ type: 'checking' }))
    autoUpdater.on('update-available', (info) => this.setStatus({ type: 'available', version: info.version }))
    autoUpdater.on('download-progress', (progress) => this.setStatus({ type: 'downloading', percent: progress.percent }))
    autoUpdater.on('update-downloaded', (info) => this.setStatus({ type: 'downloaded', version: info.version }))
    autoUpdater.on('error', (err) => this.setStatus({ type: 'error', message: err.message }))
  }

  private setStatus(status: UpdateStatus) {
    this.status = status
    const win = this.getWindow()
    if (win) {
      win.webContents.send(IPC.UPDATE_STATUS, status)
    }
  }

  init() {
    // Check every hour
    setInterval(() => autoUpdater.checkForUpdates(), 60 * 60 * 1000)
    autoUpdater.checkForUpdates()
  }

  async manualCheck() {
    return autoUpdater.checkForUpdates()
  }

  install() {
    autoUpdater.quitAndInstall()
  }
}

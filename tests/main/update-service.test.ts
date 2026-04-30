import { UpdateService } from '../../src/main/services/update-service'
import { autoUpdater } from 'electron-updater'
import { IPC } from '../../src/renderer/types/ipc'

jest.mock('electron-updater', () => ({
  autoUpdater: {
    on: jest.fn(),
    checkForUpdates: jest.fn(),
    quitAndInstall: jest.fn(),
    autoDownload: false,
    autoInstallOnAppQuit: false,
  }
}))

describe('UpdateService', () => {
  let send: jest.Mock
  let service: UpdateService

  beforeEach(() => {
    jest.clearAllMocks()
    send = jest.fn()
    service = new UpdateService(() => ({ webContents: { send } } as any))
  })

  it('should register listeners on initialization', () => {
    expect(autoUpdater.on).toHaveBeenCalledWith('checking-for-update', expect.any(Function))
    expect(autoUpdater.on).toHaveBeenCalledWith('update-available', expect.any(Function))
    expect(autoUpdater.on).toHaveBeenCalledWith('download-progress', expect.any(Function))
    expect(autoUpdater.on).toHaveBeenCalledWith('update-downloaded', expect.any(Function))
    expect(autoUpdater.on).toHaveBeenCalledWith('error', expect.any(Function))
  })

  it('should send status to window when update is available', () => {
    // Find the 'update-available' callback
    const onCall = (autoUpdater.on as jest.Mock).mock.calls.find(call => call[0] === 'update-available')
    const callback = onCall[1]
    
    callback({ version: '1.2.3' })
    
    expect(send).toHaveBeenCalledWith(IPC.UPDATE_STATUS, { type: 'available', version: '1.2.3' })
  })
})

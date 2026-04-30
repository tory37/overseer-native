import { loadShellEnv } from '../../src/main/services/shell-env'
import { execSync } from 'child_process'
import os from 'os'

jest.mock('child_process')
jest.mock('os')

describe('loadShellEnv', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    process.env = { ...originalEnv }
    delete process.env.NODE_ENV
    jest.clearAllMocks()
    ;(os.platform as jest.Mock).mockReturnValue('darwin')
    ;(os.userInfo as jest.Mock).mockReturnValue({ shell: '/bin/zsh' })
  })

  afterAll(() => {
    process.env = originalEnv
  })

  test('syncs environment variables from shell output', () => {
    ;(execSync as jest.Mock).mockReturnValue('PATH=/usr/local/bin:/usr/bin\nCUSTOM_VAR=hello=world\nNODE_ENV=production\n')
    
    loadShellEnv()
    
    expect(process.env.PATH).toBe('/usr/local/bin:/usr/bin')
    expect(process.env.CUSTOM_VAR).toBe('hello=world')
    // Should NOT sync NODE_ENV as it is in the blacklist
    expect(process.env.NODE_ENV).toBeUndefined()
  })

  test('defaults to /bin/zsh on Mac if SHELL is missing', () => {
    delete process.env.SHELL
    ;(execSync as jest.Mock).mockReturnValue('PATH=/usr/bin\n')
    
    loadShellEnv()
    
    expect(execSync).toHaveBeenCalledWith(expect.stringContaining('/bin/zsh -l -c'), expect.any(Object))
  })
})

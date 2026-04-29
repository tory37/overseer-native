import { ConfigService } from '../../src/main/services/config-service'
import fs from 'fs'
import os from 'os'
import path from 'path'

describe('ConfigService', () => {
  const testDir = path.join(os.tmpdir(), 'overseer-test-config-service')
  const service = new ConfigService(testDir)

  afterAll(async () => {
    await fs.promises.rm(testDir, { recursive: true, force: true })
  })

  it('should write and read config files', async () => {
    const data = { foo: 'bar' }
    await service.write('test.json', data)
    const read = await service.read<{ foo: string }>('test.json')
    expect(read).toEqual(data)
  })

  it('should return null for non-existent files', async () => {
    const read = await service.read('missing.json')
    expect(read).toBeNull()
  })
})

describe('ConfigService Custom Dir', () => {
  const customDir = path.join(os.tmpdir(), 'overseer-test-custom')
  
  afterEach(async () => {
    try { await fs.promises.rm(customDir, { recursive: true, force: true }) } catch {}
  })

  it('should use the provided custom base directory', async () => {
    const service = new ConfigService(customDir)
    await service.write('test.json', { foo: 'bar' })
    const exists = fs.existsSync(path.join(customDir, 'test.json'))
    expect(exists).toBe(true)
  })
})

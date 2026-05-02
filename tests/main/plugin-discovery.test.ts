import fs from 'fs'
import path from 'path'
import os from 'os'
import { discoverPlugins } from '../../src/main/plugin-discovery'

describe('discoverPlugins', () => {
  let tmpDir: string

  beforeEach(async () => {
    tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'overseer-plugins-test-'))
  })

  afterEach(async () => {
    await fs.promises.rm(tmpDir, { recursive: true, force: true })
  })

  test('returns empty array when plugins directory does not exist', async () => {
    const result = await discoverPlugins('/nonexistent/path/that/cannot/exist')
    expect(result).toEqual([])
  })

  test('returns empty array when plugins directory is empty', async () => {
    const result = await discoverPlugins(tmpDir)
    expect(result).toEqual([])
  })

  test('skips subdirectories without plugin.json', async () => {
    await fs.promises.mkdir(path.join(tmpDir, 'no-manifest'))
    const result = await discoverPlugins(tmpDir)
    expect(result).toEqual([])
  })

  test('skips subdirectories with malformed plugin.json and logs error', async () => {
    const pluginDir = path.join(tmpDir, 'bad-plugin')
    await fs.promises.mkdir(pluginDir)
    await fs.promises.writeFile(path.join(pluginDir, 'plugin.json'), 'not valid json {{')
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const result = await discoverPlugins(tmpDir)
    expect(result).toEqual([])
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  test('skips plugin.json with missing required fields', async () => {
    const pluginDir = path.join(tmpDir, 'incomplete-plugin')
    await fs.promises.mkdir(pluginDir)
    await fs.promises.writeFile(
      path.join(pluginDir, 'plugin.json'),
      JSON.stringify({ name: 'Missing tools field' })
    )
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const result = await discoverPlugins(tmpDir)
    expect(result).toEqual([])
    consoleSpy.mockRestore()
  })

  test('loads a valid plugin and resolves entry to absolute path', async () => {
    const pluginDir = path.join(tmpDir, 'my-plugin')
    await fs.promises.mkdir(pluginDir)
    await fs.promises.writeFile(
      path.join(pluginDir, 'plugin.json'),
      JSON.stringify({
        name: 'My Plugin',
        version: '1.0.0',
        tools: [{ id: 'git', name: 'Git', icon: 'git-branch', entry: 'git.js' }],
      })
    )
    const result = await discoverPlugins(tmpDir)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      id: 'git',
      name: 'Git',
      icon: 'git-branch',
      entry: path.join(pluginDir, 'git.js'),
      pluginName: 'My Plugin',
    })
  })

  test('loads multiple tools from a single plugin', async () => {
    const pluginDir = path.join(tmpDir, 'multi-tool-plugin')
    await fs.promises.mkdir(pluginDir)
    await fs.promises.writeFile(
      path.join(pluginDir, 'plugin.json'),
      JSON.stringify({
        name: 'Multi',
        version: '1.0.0',
        tools: [
          { id: 'tool-a', name: 'Tool A', icon: 'a', entry: 'a.js' },
          { id: 'tool-b', name: 'Tool B', icon: 'b', entry: 'b.js' },
        ],
      })
    )
    const result = await discoverPlugins(tmpDir)
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('tool-a')
    expect(result[1].id).toBe('tool-b')
    expect(result[0].entry).toBe(path.join(pluginDir, 'a.js'))
  })

  test('loads tools from multiple plugin directories', async () => {
    for (const name of ['plugin-alpha', 'plugin-beta']) {
      const pluginDir = path.join(tmpDir, name)
      await fs.promises.mkdir(pluginDir)
      await fs.promises.writeFile(
        path.join(pluginDir, 'plugin.json'),
        JSON.stringify({
          name,
          version: '1.0.0',
          tools: [{ id: name, name, icon: 'x', entry: 'index.js' }],
        })
      )
    }
    const result = await discoverPlugins(tmpDir)
    expect(result).toHaveLength(2)
  })

  test('ignores files at the top level of pluginsDir (only reads subdirectories)', async () => {
    await fs.promises.writeFile(
      path.join(tmpDir, 'plugin.json'),
      JSON.stringify({ name: 'root-level', version: '1.0.0', tools: [] })
    )
    const result = await discoverPlugins(tmpDir)
    expect(result).toEqual([])
  })
})

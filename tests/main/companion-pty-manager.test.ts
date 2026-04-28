import { CompanionPtyManager } from '../../src/main/companion-pty-manager'

const CWD = process.cwd()

test('spawns a companion PTY in the given cwd and receives stdout', (done) => {
  const mgr = new CompanionPtyManager()
  const received: string[] = []
  const id = mgr.spawn(CWD, (_id, data) => {
    received.push(data)
    if (received.join('').includes('hello-companion')) {
      mgr.kill(id)
      done()
    }
  }, () => {})
  setTimeout(() => mgr.write(id, 'echo hello-companion\r'), 100)
}, 5000)

test('has() returns true after spawn and false after kill', (done) => {
  const mgr = new CompanionPtyManager()
  const id = mgr.spawn(CWD, () => {}, () => {})
  expect(mgr.has(id)).toBe(true)
  setTimeout(() => {
    mgr.kill(id)
    expect(mgr.has(id)).toBe(false)
    done()
  }, 200)
}, 5000)

test('multiple companions can coexist with independent ids', (done) => {
  const mgr = new CompanionPtyManager()
  const id1 = mgr.spawn(CWD, () => {}, () => {})
  const id2 = mgr.spawn(CWD, () => {}, () => {})
  expect(id1).not.toBe(id2)
  expect(mgr.has(id1)).toBe(true)
  expect(mgr.has(id2)).toBe(true)
  setTimeout(() => {
    mgr.kill(id1)
    expect(mgr.has(id1)).toBe(false)
    expect(mgr.has(id2)).toBe(true)
    mgr.kill(id2)
    done()
  }, 100)
}, 5000)

test('data callback includes the companion id', (done) => {
  const mgr = new CompanionPtyManager()
  const receivedIds: string[] = []
  const id = mgr.spawn(CWD, (receivedId, data) => {
    receivedIds.push(receivedId)
    if (data.includes('id-check')) {
      expect(receivedIds.every(rid => rid === id)).toBe(true)
      mgr.kill(id)
      done()
    }
  }, () => {})
  setTimeout(() => mgr.write(id, 'echo id-check\r'), 100)
}, 5000)

test('write after kill is a no-op (no throw)', (done) => {
  const mgr = new CompanionPtyManager()
  const id = mgr.spawn(CWD, () => {}, () => {})
  setTimeout(() => {
    mgr.kill(id)
    expect(() => mgr.write(id, 'echo hi\r')).not.toThrow()
    done()
  }, 100)
}, 5000)

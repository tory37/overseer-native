import { CompanionPtyManager } from '../../src/main/companion-pty-manager'

test('spawns a companion PTY and receives stdout', (done) => {
  const mgr = new CompanionPtyManager()
  const received: string[] = []
  const id = mgr.spawn((data) => {
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
  const id = mgr.spawn(() => {}, () => {})
  expect(mgr.has(id)).toBe(true)
  setTimeout(() => {
    mgr.kill(id)
    expect(mgr.has(id)).toBe(false)
    done()
  }, 200)
}, 5000)

test('second spawn kills the first and returns a different id', (done) => {
  const mgr = new CompanionPtyManager()
  const id1 = mgr.spawn(() => {}, () => {})
  setTimeout(() => {
    const id2 = mgr.spawn(() => {}, () => {})
    expect(id2).not.toBe(id1)
    expect(mgr.has(id1)).toBe(false)
    expect(mgr.has(id2)).toBe(true)
    mgr.kill(id2)
    done()
  }, 100)
}, 5000)

test('write after kill is a no-op (no throw)', (done) => {
  const mgr = new CompanionPtyManager()
  const id = mgr.spawn(() => {}, () => {})
  setTimeout(() => {
    mgr.kill(id)
    expect(() => mgr.write(id, 'echo hi\r')).not.toThrow()
    done()
  }, 100)
}, 5000)

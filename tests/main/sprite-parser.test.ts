import { parseSpriteSpeech, SpriteParser } from '../../src/main/sprite-parser'

test('returns empty array for chunk with no speak tags', () => {
  expect(parseSpriteSpeech('hello world')).toEqual([])
})

test('extracts a single speak tag', () => {
  expect(parseSpriteSpeech('<speak>hey there</speak>')).toEqual([
    { type: 'speech', text: 'hey there' },
  ])
})

test('extracts multiple speak tags from one chunk', () => {
  expect(parseSpriteSpeech('foo <speak>one</speak> bar <speak>two</speak> baz')).toEqual([
    { type: 'speech', text: 'one' },
    { type: 'speech', text: 'two' },
  ])
})

test('strips ANSI escape codes from speech text', () => {
  const chunk = '<speak>Hello \x1b[39m\x1b[38;5;231mWorld</speak>'
  expect(parseSpriteSpeech(chunk)).toEqual([
    { type: 'speech', text: 'Hello World' }
  ])
})

test('SpriteParser handles tags split across chunks', () => {
  const parser = new SpriteParser()
  
  expect(parser.parse('<spe')).toEqual([])
  expect(parser.parse('ak>Hello ')).toEqual([])
  expect(parser.parse('World</spe')).toEqual([])
  expect(parser.parse('ak>')).toEqual([
    { type: 'speech', text: 'Hello World' }
  ])
})

test('SpriteParser handles multiple tags across multiple chunks', () => {
  const parser = new SpriteParser()
  
  expect(parser.parse('ignore <speak>First</speak> partial <speak>Sec')).toEqual([
    { type: 'speech', text: 'First' }
  ])
  expect(parser.parse('ond</speak> and <speak>Third</speak> more')).toEqual([
    { type: 'speech', text: 'Second' },
    { type: 'speech', text: 'Third' }
  ])
})

test('SpriteParser handles echoed/nested tags by taking the latest start tag', () => {
  const parser = new SpriteParser()
  // Simulate an echo where the terminal repeats the start of the tag
  expect(parser.parse('<speak>Hello ')).toEqual([])
  expect(parser.parse('<speak>Hello world</speak>')).toEqual([
    { type: 'speech', text: 'Hello world' }
  ])
})

test('decodes HTML entities in speech text', () => {
  const chunk = '<speak>Every sprite in Overseer now has a name and the AI knows exactly who it&#x27;s playing!</speak>'
  expect(parseSpriteSpeech(chunk)).toEqual([
    { type: 'speech', text: "Every sprite in Overseer now has a name and the AI knows exactly who it's playing!" }
  ])
})

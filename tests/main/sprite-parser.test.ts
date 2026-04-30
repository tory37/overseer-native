import { parseSpriteSpeech } from '../../src/main/sprite-parser'

test('returns empty array for chunk with no speak tags', () => {
  expect(parseSpriteSpeech('hello world')).toEqual([])
})

test('returns empty array for empty string', () => {
  expect(parseSpriteSpeech('')).toEqual([])
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

test('ignores unclosed speak tags', () => {
  expect(parseSpriteSpeech('<speak>unclosed')).toEqual([])
})

test('ignores empty speak tags', () => {
  expect(parseSpriteSpeech('<speak></speak>')).toEqual([])
})

test('handles speak tag mixed with other output', () => {
  const chunk = '[32msome ansi[0m <speak>hello sailor</speak> more text'
  expect(parseSpriteSpeech(chunk)).toEqual([{ type: 'speech', text: 'hello sailor' }])
})

test('ignores speak tags within system prompt instructions', () => {
  const instruction = 'When you want to speak as your character persona, wrap your comments in <speak></speak> tags (e.g., <speak>Hello!</speak>). Keep these comments brief (1-2 sentences) and interspersed with your work.  Your persona is: '
  expect(parseSpriteSpeech(instruction)).toEqual([])
})

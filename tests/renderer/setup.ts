export const mockOverseer = {
  load: jest.fn(),
  readTheme: jest.fn().mockResolvedValue({ activeThemeId: 'overseer-dark', customThemes: [] }),
  writeTheme: jest.fn().mockResolvedValue(undefined),
  readKeybindings: jest.fn().mockResolvedValue(null),
  writeKeybindings: jest.fn().mockResolvedValue(undefined),
  onPtyData: jest.fn().mockReturnValue(() => {}),
  onPtyError: jest.fn().mockReturnValue(() => {}),
  getScrollback: jest.fn().mockResolvedValue(''),
  resize: jest.fn(),
  sendInput: jest.fn(),
  onCompanionData: jest.fn().mockReturnValue(() => {}),
  onCompanionError: jest.fn().mockReturnValue(() => {}),
  onCompanionExit: jest.fn().mockReturnValue(() => {}),
  onSpriteSpeech: jest.fn().mockReturnValue(() => {}),
  spawnCompanion: jest.fn().mockResolvedValue({ id: 'c1' }),
  killCompanion: jest.fn().mockResolvedValue(undefined),
  killSession: jest.fn().mockResolvedValue(undefined),
  listSessions: jest.fn().mockResolvedValue([]),
  readSprites: jest.fn().mockResolvedValue({ sprites: [] }),
  writeSprites: jest.fn().mockResolvedValue(undefined),
}

beforeEach(() => {
  (window as any).overseer = { ...mockOverseer }
})

import { getSmartSelectionText } from '../../src/renderer/lib/terminal-utils';

describe('getSmartSelectionText', () => {
  const mockTerminal = (lines: { text: string, isWrapped: boolean }[], selection: { start: { x: number, y: number }, end: { x: number, y: number } } | null) => {
    return {
      hasSelection: () => !!selection,
      getSelectionPosition: () => selection,
      getSelection: () => 'fallback', 
      cols: 80,
      buffer: {
        active: {
          length: lines.length,
          getLine: (y: number) => {
            const line = lines[y];
            if (!line) return undefined;
            return {
              isWrapped: line.isWrapped,
              translateToString: (trimRight?: boolean, start?: number, end?: number) => {
                let s = line.text.substring(start ?? 0, end ?? line.text.length);
                if (trimRight) s = s.trimEnd();
                return s;
              }
            };
          }
        }
      }
    } as any;
  };

  it('should join wrapped lines without a newline', () => {
    const term = mockTerminal([
      { text: 'This is a long line that wraps', isWrapped: false },
      { text: 'at the end of the terminal.', isWrapped: true }
    ], { start: { x: 0, y: 0 }, end: { x: 27, y: 1 } });
    
    const result = getSmartSelectionText(term);
    expect(result).toBe('This is a long line that wrapsat the end of the terminal.');
  });

  it('should keep newlines for non-wrapped lines', () => {
    const term = mockTerminal([
      { text: 'Line 1', isWrapped: false },
      { text: 'Line 2', isWrapped: false }
    ], { start: { x: 0, y: 0 }, end: { x: 6, y: 1 } });
    
    const result = getSmartSelectionText(term);
    expect(result).toBe('Line 1\nLine 2');
  });

  it('should handle partial selection correctly', () => {
    const term = mockTerminal([
      { text: 'ABCDE', isWrapped: false },
      { text: 'FGHIJ', isWrapped: true }
    ], { start: { x: 2, y: 0 }, end: { x: 2, y: 1 } }); 
    
    const result = getSmartSelectionText(term);
    expect(result).toBe('CDEFG');
  });

  it('should trim trailing whitespace on the last line if not wrapped', () => {
    // Current implementation might NOT trim the last line.
    // Let's see if this test fails.
    const term = mockTerminal([
      { text: 'Line 1    ', isWrapped: false },
    ], { start: { x: 0, y: 0 }, end: { x: 10, y: 0 } });
    
    const result = getSmartSelectionText(term);
    expect(result).toBe('Line 1');
  });

  it('should join multiple consecutive wrapped lines', () => {
    const term = mockTerminal([
      { text: 'Part 1          ', isWrapped: false },
      { text: 'Part 2          ', isWrapped: true },
      { text: 'Part 3', isWrapped: true }
    ], { start: { x: 0, y: 0 }, end: { x: 6, y: 2 } });
    
    // With cols=80, Part 1 and Part 2 will have trailing spaces preserved because they wrap
    const result = getSmartSelectionText(term);
    // Note: in our mock, we don't simulate full 80 cols perfectly, but the logic should hold
    expect(result).toBe('Part 1          Part 2          Part 3');
  });
});

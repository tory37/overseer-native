import { Terminal } from '@xterm/xterm';

export function getSmartSelectionText(term: Terminal): string {
  if (!term.hasSelection()) {
    return '';
  }

  const range = term.getSelectionPosition();
  if (!range) {
    return term.getSelection();
  }

  let text = '';
  const buffer = term.buffer.active;

  for (let y = range.start.y; y <= range.end.y; y++) {
    const line = buffer.getLine(y);
    if (!line) continue;

    const isFirstLine = y === range.start.y;
    const isLastLine = y === range.end.y;

    const startX = isFirstLine ? range.start.x : 0;
    const endX = isLastLine ? range.end.x : term.cols;

    const nextLine = y < buffer.length - 1 ? buffer.getLine(y + 1) : undefined;
    const isWrappedNext = nextLine ? nextLine.isWrapped : false;

    const lineText = line.translateToString(!isWrappedNext, startX, endX);
    text += lineText;

    if (!isLastLine && !isWrappedNext) {
      text += '\n';
    }
  }

  return text;
}

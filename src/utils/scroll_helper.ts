/**
 * Attaches a 'wheel' event listener to an element to translate vertical mouse scrolling into horizontal scrolling.
 * Returns a cleanup function to remove the event listener.
 */
export function setupHorizontalWheelScroll(element: HTMLElement | null): (() => void) | undefined {
  if (!element) return undefined;

  const handleWheelEvent = (e: WheelEvent) => {
    if (e.deltaY !== 0) {
      e.preventDefault();
      element.scrollLeft += e.deltaY;
    }
  };

  element.addEventListener('wheel', handleWheelEvent, { passive: false });
  return () => {
    element.removeEventListener('wheel', handleWheelEvent);
  };
}

const isNoteBlack = (midi: number) => [1, 3, 6, 8, 10].includes(midi % 12);

const whiteKeysList: number[] = [];
for (let m = 21; m <= 108; m++) {
  if (!isNoteBlack(m)) whiteKeysList.push(m);
}

/**
 * Calculates the scrollLeft position required to place the target MIDI note 
 * one white key after the leftmost visible key.
 */
export function calculateMidiCenteringScroll(midi: number, whiteKeyWidth: number): number {
  let keyToScroll = midi;
  if (isNoteBlack(keyToScroll)) {
    keyToScroll -= 1;
  }
  const whiteKeyIdx = whiteKeysList.indexOf(keyToScroll);
  if (whiteKeyIdx !== -1) {
    return Math.max(0, Math.floor((whiteKeyIdx - 1) * whiteKeyWidth));
  }
  return 0;
}

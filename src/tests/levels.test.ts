import {
  isQueuedLevel,
  getAnswerChoices,
  getLevelDuration,
  buildLevel,
  getPreloadMidi
} from '../levels';

describe('Levels System', () => {
  describe('isQueuedLevel', () => {
    test('correctly identifies queued levels', () => {
      expect(isQueuedLevel(1)).toBe(true);
      expect(isQueuedLevel(2)).toBe(true);
      expect(isQueuedLevel(3)).toBe(false);
      expect(isQueuedLevel(4)).toBe(true);
      expect(isQueuedLevel(5)).toBe(true);
      expect(isQueuedLevel(6)).toBe(false);
    });
  });

  describe('getAnswerChoices', () => {
    test('returns exact mapping of choices for all 6 levels', () => {
      expect(getAnswerChoices(1)).toEqual(['1', '2', '3', '4']);
      expect(getAnswerChoices(2)).toEqual(['5', '6', '7', '8']);
      expect(getAnswerChoices(3)).toEqual(['1', '2', '3', '4', '5', '6', '7', '8']);
      expect(getAnswerChoices(4)).toEqual(['I', 'IV', 'V']);
      expect(getAnswerChoices(5)).toEqual(['I', 'IV', 'V']);
      expect(getAnswerChoices(6)).toEqual(['I', 'IV', 'V']);
      expect(getAnswerChoices(99)).toEqual([]);
    });
  });

  describe('getLevelDuration', () => {
    test('returns correct duration bounds', () => {
      expect(getLevelDuration(1)).toBe(3.0);
      expect(getLevelDuration(2)).toBe(3.0);
      expect(getLevelDuration(3)).toBe(18.0);
      expect(getLevelDuration(4)).toBe(15.0);
      expect(getLevelDuration(5)).toBe(15.0);
      expect(getLevelDuration(6)).toBe(20.0);
    });
  });

  describe('buildLevel & getPreloadMidi', () => {
    test('builds midi_player level and preload midi successfully', () => {
      const midiPlayer = buildLevel('midi_player', 1);
      expect(midiPlayer).toBeDefined();
      expect(midiPlayer.bpm).toBe(120);
      expect(midiPlayer.preloadMidi.length).toBeGreaterThan(0);

      const preloadMidi = getPreloadMidi('midi_player', 1);
      expect(preloadMidi.length).toBeGreaterThan(0);
    });

    test.each([1, 2, 3, 4, 5, 6])('builds level %d successfully and preloads midi', (level) => {
      const setup = buildLevel('trainer', level);
      expect(setup).toBeDefined();
      expect(setup.bpm).toBeGreaterThan(0);
      expect(setup.ticksPerBeat).toBe(480);
      expect(setup.baseOctave).toBeGreaterThanOrEqual(3);

      if (level !== 3 && level !== 6) {
        expect(setup.slots.length).toBeGreaterThan(0);
      }

      const preloads = getPreloadMidi('trainer', level);
      expect(preloads.length).toBeGreaterThan(0);
      // Ensure sorted order
      const isSorted = preloads.every((val, i, arr) => !i || arr[i - 1] <= val);
      expect(isSorted).toBe(true);
    });
  });
});

import { BaseLevel } from '../levels/base_level';
import { NoteConverter } from '../utils/note_converter';

describe('NoteConverter', () => {
  const converter = new NoteConverter(0, 4, 120, 480); // C major, Middle C, 120 BPM

  test('MIDI to Relative and back is 1:1 for pitch', () => {
    for (let midi = 0; midi <= 127; midi++) {
      const relative = converter.fromMidi(midi);
      const backToMidi = converter.toMidi(relative);
      expect(backToMidi).toBe(midi);
    }
  });

  test('Ticks to Seconds and back is reversible (pitch independent)', () => {
    const ticks = 960; // 2 beats
    const seconds = converter.ticksToSeconds(ticks);
    expect(seconds).toBe(1.0); // 120 BPM -> 2 beats = 1 second
    
    const backToTicks = converter.secondsToTicks(seconds);
    expect(backToTicks).toBe(ticks);
  });

  test('Handles different tonic and octaves', () => {
    const gSharpConverter = new NoteConverter(8, 3, 100, 480); // G#, Octave 3
    const midi = 60; // Middle C
    const relative = gSharpConverter.fromMidi(midi);
    
    // Base G#3 is (3+1)*12 + 8 = 48 + 8 = 56.
    // 60 - 56 = 4. 4 is degree 4 (Major 3rd above G# is C, wait G# A A# B C... 4 semitones)
    expect(relative.degree).toBe(4);
    expect(relative.offset).toBe(0);
    
    expect(gSharpConverter.toMidi(relative)).toBe(midi);
  });
});

describe('BaseLevel Scale Degree Labeling', () => {
  class TestScaleLevel extends BaseLevel {
    public readonly isChordLevel = false;
    constructor() {
      super({
        id: 99,
        bpm: 120,
        tonic: 0,
        octave: 4,
        answerChoices: ['1', '2', '3', '4', '5', '6', '7', '8'],
      });
    }
    build() {
      return {
        melody: [],
        chords: [],
        slots: [],
        bpm: 120,
        ticksPerBeat: 480,
        tonicPitchClass: 0,
        baseOctave: 4,
        preloadMidi: []
      };
    }
  }

  const level = new TestScaleLevel();

  test('correctly infers scale degrees, including the octave note as "8"', () => {
    // 1st degree / Tonic (offset 0) -> '1'
    expect(level.inferLabel({ degree: 0, offset: 0 })).toBe('1');
    
    // 2nd degree -> '2'
    expect(level.inferLabel({ degree: 2, offset: 0 })).toBe('2');
    
    // 5th degree -> '5'
    expect(level.inferLabel({ degree: 7, offset: 0 })).toBe('5');
    
    // Octave note (degree 0, offset 1) -> '8'
    expect(level.inferLabel({ degree: 0, offset: 1 })).toBe('8');
  });
});


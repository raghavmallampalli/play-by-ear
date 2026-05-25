import { buildLevel1 } from './level1';
import { buildLevel2 } from './level2';
import { buildLevel3 } from './level3';
import { buildLevel4 } from './level4';
import { buildLevel5 } from './level5';
import { buildLevel6 } from './level6';
import { buildSandboxNotes, SANDBOX_PRELOAD_MIDI } from './sandbox';
import { LevelSetup } from '../types/levels';
import { NoteConverter } from '../utils/note_converter';

export * from '../types/levels';

/**
 * Determine if a level should have a 10-exercise queue of sets.
 * This applies to levels 1, 2, 4, 5 and future 1st & 2nd levels of each group (i.e., not the 3rd level).
 */
export function isQueuedLevel(level: number): boolean {
  return level % 3 !== 0;
}



import { EXERCISE_HASHES } from '../constants/exercises';
export { EXERCISE_HASHES };

const ANSWER_CHOICES_MAP: Record<number, string[]> = {
  1: ['1', '2', '3', '4'],
  2: ['5', '6', '7', '8'],
  3: ['1', '2', '3', '4', '5', '6', '7', '8'],
  4: ['I', 'IV', 'V'],
  5: ['I', 'IV', 'V'],
  6: ['I', 'IV', 'V'],
};

/** Answer button labels shown to the user for a given level. */
export function getAnswerChoices(level: number): string[] {
  return ANSWER_CHOICES_MAP[level] || [];
}

/** All MIDI notes that should be warm-cached for the given mode/level. */
export function getPreloadMidi(mode: 'trainer' | 'sandbox' | 'progress', level: number): number[] {
  if (mode === 'sandbox') return SANDBOX_PRELOAD_MIDI;
  try {
    const setup = buildLevel(mode, level);
    const converter = new NoteConverter(setup.tonicPitchClass, setup.baseOctave, setup.bpm, setup.ticksPerBeat);
    
    const midiSet = new Set<number>();
    
    // 1. Add melody notes
    setup.melody.forEach(n => midiSet.add(converter.toMidi(n.note)));
    
    // 2. Add chord notes
    setup.chords.forEach(c => c.notes.forEach(n => midiSet.add(converter.toMidi(n))));
    
    // 3. Add choice audio notes so they are preloaded for gameplay feedback
    const choices = getAnswerChoices(level);
    choices.forEach(choice => {
      switch (choice) {
        case '1': midiSet.add(converter.toMidi({degree:0, offset:0})); break;
        case '2': midiSet.add(converter.toMidi({degree:2, offset:0})); break;
        case '3': midiSet.add(converter.toMidi({degree:4, offset:0})); break;
        case '4': midiSet.add(converter.toMidi({degree:5, offset:0})); break;
        case '5': midiSet.add(converter.toMidi({degree:7, offset:0})); break;
        case '6': midiSet.add(converter.toMidi({degree:9, offset:0})); break;
        case '7': midiSet.add(converter.toMidi({degree:11, offset:0})); break;
        case '8': midiSet.add(converter.toMidi({degree:0, offset:1})); break;
        case 'I':
          midiSet.add(converter.toMidi({degree:0, offset:-1}));
          midiSet.add(converter.toMidi({degree:4, offset:-1}));
          midiSet.add(converter.toMidi({degree:7, offset:-1}));
          break;
        case 'IV':
          midiSet.add(converter.toMidi({degree:0, offset:-1}));
          midiSet.add(converter.toMidi({degree:5, offset:-1}));
          midiSet.add(converter.toMidi({degree:9, offset:-1}));
          break;
        case 'V':
          midiSet.add(converter.toMidi({degree:11, offset:-2}));
          midiSet.add(converter.toMidi({degree:2, offset:-1}));
          midiSet.add(converter.toMidi({degree:7, offset:-1}));
          break;
      }
    });

    // 4. Add cadence / grounding notes
    const cadenceRelNotes = [
      { degree: 0, offset: 0 },
      { degree: 4, offset: 0 },
      { degree: 7, offset: 0 },
      { degree: 5, offset: 0 },
      { degree: 9, offset: 0 },
      { degree: 11, offset: -1 },
      { degree: 2, offset: 0 },
      { degree: 7, offset: -1 }
    ];
    cadenceRelNotes.forEach(n => midiSet.add(converter.toMidi(n)));

    return Array.from(midiSet).sort((a, b) => a - b);
  } catch {
    return [];
  }
}

/** Build the full exercise (notes + slots + bpm) for a trainer level. */
export function buildLevel(
  mode: 'trainer' | 'sandbox' | 'progress',
  level: number,
): LevelSetup {
  if (mode === 'sandbox') {
    const { melody, chords } = buildSandboxNotes();
    return {
      melody,
      chords,
      slots: [],
      bpm: 120,
      ticksPerBeat: 480,
      tonicPitchClass: 0,
      baseOctave: 4,
      preloadMidi: SANDBOX_PRELOAD_MIDI
    };
  }
  switch (level) {
    case 1: return buildLevel1();
    case 2: return buildLevel2();
    case 3: return buildLevel3();
    case 4: return buildLevel4();
    case 5: return buildLevel5();
    case 6: return buildLevel6();
    default:
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

/** Duration (in seconds) of a trainer level's timeline, for playhead clamping. */
export function getLevelDuration(level: number): number {
  if (level === 3) return 18.0;
  if (level === 6) return 20.0;
  if (level >= 4) return 15.0;
  return 3.0;
}

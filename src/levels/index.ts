import { buildLevel1 } from './level1';
import { buildLevel2 } from './level2';
import { buildLevel3 } from './level3';
import { buildLevel4 } from './level4';
import { buildLevel5 } from './level5';
import { buildLevel6 } from './level6';
import { buildLevel7 } from './level7';
import { buildLevel8 } from './level8';
import { buildLevel9 } from './level9';
import { buildLevel10 } from './level10';
import { buildLevel11 } from './level11';
import { buildLevel12 } from './level12';
import { buildLevel13 } from './level13';
import { buildLevel14 } from './level14';
import { buildLevel15 } from './level15';
import { buildLevel16 } from './level16';
import { buildLevel17 } from './level17';
import { buildLevel18 } from './level18';
import { buildMidiPlayerDemoNotes, MIDI_PLAYER_PRELOAD_MIDI } from './midi_player';
import { LevelSetup } from '../types/levels';
import { NoteConverter } from '../utils/note_converter';
import { CHORD_DICTIONARY, MELODY_DICTIONARY } from './labels';

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
  7: ['I', 'IV', 'V', 'ii', 'iii', 'vi'],
  8: ['I', 'IV', 'V', 'ii', 'iii', 'vi'],
  9: ['I', 'IV', 'V', 'ii', 'iii', 'vi'],
  10: ['I', 'i_dim', 'I_aug'],
  11: ['I', 'i_dim', 'I_aug'],
  12: ['I', 'i_dim', 'I_aug'],
  13: ['I', 'Isus2', 'Isus4'],
  14: ['I', 'Isus2', 'Isus4'],
  15: ['I', 'Isus2', 'Isus4'],
  16: ['IMaj7', 'V7', 'ii_m7', 'vi_m7'],
  17: ['IMaj7', 'V7', 'ii_m7', 'vi_m7'],
  18: ['IMaj7', 'V7', 'ii_m7', 'vi_m7'],
};

/** Answer button labels shown to the user for a given level. */
export function getAnswerChoices(level: number): string[] {
  return ANSWER_CHOICES_MAP[level] || [];
}

/** All MIDI notes that should be warm-cached for the given mode/level. */
export function getPreloadMidi(mode: 'trainer' | 'midi_player' | 'progress', level: number): number[] {
  if (mode === 'midi_player') return MIDI_PLAYER_PRELOAD_MIDI;
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
      if (MELODY_DICTIONARY[choice]) {
        midiSet.add(converter.toMidi(MELODY_DICTIONARY[choice]));
      } else if (CHORD_DICTIONARY[choice]) {
        CHORD_DICTIONARY[choice].forEach(n => midiSet.add(converter.toMidi(n)));
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
      { degree: 7, offset: 0 }
    ];
    cadenceRelNotes.forEach(n => midiSet.add(converter.toMidi(n)));

    return Array.from(midiSet).sort((a, b) => a - b);
  } catch {
    return [];
  }
}

/** Build the full exercise (notes + slots + bpm) for a trainer level. */
export function buildLevel(
  mode: 'trainer' | 'midi_player' | 'progress',
  level: number,
): LevelSetup {
  if (mode === 'midi_player') {
    const { melody, chords } = buildMidiPlayerDemoNotes();
    return {
      melody,
      chords,
      slots: [],
      bpm: 120,
      ticksPerBeat: 480,
      tonicPitchClass: 0,
      baseOctave: 4,
      preloadMidi: MIDI_PLAYER_PRELOAD_MIDI
    };
  }
  switch (level) {
    case 1: return buildLevel1();
    case 2: return buildLevel2();
    case 3: return buildLevel3();
    case 4: return buildLevel4();
    case 5: return buildLevel5();
    case 6: return buildLevel6();
    case 7: return buildLevel7();
    case 8: return buildLevel8();
    case 9: return buildLevel9();
    case 10: return buildLevel10();
    case 11: return buildLevel11();
    case 12: return buildLevel12();
    case 13: return buildLevel13();
    case 14: return buildLevel14();
    case 15: return buildLevel15();
    case 16: return buildLevel16();
    case 17: return buildLevel17();
    case 18: return buildLevel18();
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

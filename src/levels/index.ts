import { buildLevel1, LEVEL1_ANSWER_CHOICES } from './level1';
import { buildLevel2, LEVEL2_ANSWER_CHOICES } from './level2';
import { buildLevel3, LEVEL3_ANSWER_CHOICES } from './level3';
import { buildLevel4, LEVEL4_ANSWER_CHOICES } from './level4';
import { buildLevel5, LEVEL5_ANSWER_CHOICES } from './level5';
import { buildLevel6, LEVEL6_ANSWER_CHOICES } from './level6';
import { buildSandboxNotes, SANDBOX_PRELOAD_MIDI } from './sandbox';
import { LevelSetup } from '../types/levels';

export * from '../types/levels';

/** Stable content-hash for each level, used as the localStorage key. */
export const EXERCISE_HASHES: Record<number, string> = {
  1: 'lvl1_do_re_mi_fa',
  2: 'lvl2_sol_la_ti_do',
  3: 'lvl3_hb_melody',
  4: 'lvl4_chord_i_iv_v',
  5: 'lvl5_chord_melody',
  6: 'lvl6_hb_chords',
};

/** Answer button labels shown to the user for a given level. */
export function getAnswerChoices(level: number): string[] {
  switch (level) {
    case 1: return LEVEL1_ANSWER_CHOICES;
    case 2: return LEVEL2_ANSWER_CHOICES;
    case 3: return LEVEL3_ANSWER_CHOICES;
    case 4: return LEVEL4_ANSWER_CHOICES;
    case 5: return LEVEL5_ANSWER_CHOICES;
    case 6: return LEVEL6_ANSWER_CHOICES;
    default: return [];
  }
}

/** All MIDI notes that should be warm-cached for the given mode/level. */
export function getPreloadMidi(mode: 'trainer' | 'sandbox' | 'progress', level: number): number[] {
  if (mode === 'sandbox') return SANDBOX_PRELOAD_MIDI;
  switch (level) {
    case 1: return [60, 62, 64, 65];
    case 2: return [67, 69, 71, 72];
    case 3: return [60, 62, 64, 65, 67, 69, 71, 72];
    case 4: return [59, 60, 62, 64, 65, 67, 69, 71, 72];
    case 5: return [59, 60, 62, 64, 65, 67, 69, 71, 72];
    case 6: return [47, 48, 50, 52, 53, 55, 57, 59, 60, 62, 64, 65, 67, 69, 71, 72];
    default: return [];
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

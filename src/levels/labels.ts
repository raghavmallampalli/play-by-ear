/**
 * LABEL SYSTEM
 *
 * Internal labels are abstract and stable:
 *   - Melody degrees: '1' | '2' | '3' | '4' | '5' | '6' | '7'
 *   - Chords:        'I' | 'IV' | 'V' (etc. in Roman numeral form)
 *
 * This module handles the cosmetic display conversion.
 * Exercise definitions never import from here.
 */

import { MelodyLabelSystem, ChordLabelSystem } from '../types/labels';
import { RelativeNote } from '../types/music';

// ── Internal Dictionaries (Pitch Logic) ───────────────────────────────────────

export const CHORD_DICTIONARY: Record<string, RelativeNote[]> = {
  I: [
    { degree: 0, offset: -1 }, // C3 (Root)
    { degree: 4, offset: -1 }, // E3 (Third)
    { degree: 7, offset: -1 }, // G3 (Fifth)
  ],
  IV: [
    { degree: 5, offset: -1 }, // F3 (Root)
    { degree: 9, offset: -1 }, // A3 (Third)
    { degree: 0, offset: 0 },  // C4 (Fifth)
  ],
  V: [
    { degree: 7, offset: -1 }, // G3 (Root)
    { degree: 11, offset: -1 },// B3 (Third)
    { degree: 2, offset: 0 },  // D4 (Fifth)
  ],
};

export const MELODY_DICTIONARY: Record<string, RelativeNote> = {
  '1': { degree: 0, offset: 0 },
  '2': { degree: 2, offset: 0 },
  '3': { degree: 4, offset: 0 },
  '4': { degree: 5, offset: 0 },
  '5': { degree: 7, offset: 0 },
  '6': { degree: 9, offset: 0 },
  '7': { degree: 11, offset: 0 },
  '8': { degree: 0, offset: 1 },
};

// ── Melody maps (relative — tonicPitchClass not needed) ──────────────────────

const MELODY_CARNATIC:  Record<string, string> = { '1':'Sa','2':'Re','3':'Ga','4':'Ma','5':'Pa','6':'Dha','7':'Ni','8':'Sa' };
const MELODY_NUMERICAL: Record<string, string> = { '1':'1', '2':'2', '3':'3', '4':'4', '5':'5', '6':'6',  '7':'7', '8':'8' };
const MELODY_SOLFEGE:   Record<string, string> = { '1':'Do','2':'Re','3':'Mi','4':'Fa','5':'Sol','6':'La','7':'Ti','8':'Do' };

// ── Absolute maps (require tonicPitchClass) ───────────────────────────────────

/** Semitone offset from tonic for each scale degree in the major scale. */
const DEGREE_SEMITONES: Record<string, number> = {
  '1': 0, '2': 2, '3': 4, '4': 5, '5': 7, '6': 9, '7': 11, '8': 12,
};

/** Semitone offset from tonic for chord roots in the major scale. */
const CHORD_ROOT_SEMITONES: Record<string, number> = {
  'I': 0, 'II': 2, 'III': 4, 'IV': 5, 'V': 7, 'VI': 9, 'VII': 11,
};

const CHORD_QUALITY: Record<string, string> = {
  'I': '', 'II': 'm', 'III': 'm', 'IV': '', 'V': '', 'VI': 'm', 'VII': '°',
};

const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'] as const;

// ── Public API ────────────────────────────────────────────────────────────────

const DEGREE_RE = /^[1-8]$/;
const CHORD_RE  = /^(I{1,3}|I?V|VI{0,2}|VII)$/;

/**
 * Convert an internal label to its display string.
 *
 * @param internal         Raw label from the slot (e.g. '3', 'IV')
 * @param melody           Display system for scale degree labels
 * @param chord            Display system for chord labels
 * @param tonicPitchClass  0–11 (0 = C). Only used by 'abc' systems.
 */
export function displayLabel(
  internal: string,
  melody: MelodyLabelSystem,
  chord: ChordLabelSystem,
  tonicPitchClass = 0,
): string {
  if (DEGREE_RE.test(internal)) {
    if (melody === 'abc') {
      const pc = (tonicPitchClass + (DEGREE_SEMITONES[internal] ?? 0)) % 12;
      return NOTE_NAMES[pc];
    }
    if (melody === 'carnatic')  return MELODY_CARNATIC[internal]  ?? internal;
    if (melody === 'solfege')   return MELODY_SOLFEGE[internal]   ?? internal;
    if (melody === 'numerical') return MELODY_NUMERICAL[internal] ?? internal;
  }

  if (CHORD_RE.test(internal)) {
    if (chord === 'abc') {
      const pc = (tonicPitchClass + (CHORD_ROOT_SEMITONES[internal] ?? 0)) % 12;
      return NOTE_NAMES[pc] + (CHORD_QUALITY[internal] ?? '');
    }
    // 'roman' — identity, the internal label IS the Roman numeral
    return internal;
  }

  return internal;
}

/** App-wide defaults. A future Settings screen will expose these. */
export const DEFAULT_MELODY_LABELS: MelodyLabelSystem = 'carnatic';
export const DEFAULT_CHORD_LABELS:  ChordLabelSystem  = 'roman';

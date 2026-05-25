import { RelativeNote } from '../types/music';

// TODO: Introduce inversions as a new exercise group after minor chords, i.e., in Group 4.
// Tonic (I) can continue to use the slash chords/standard, but IV and V now use standard root-position.

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

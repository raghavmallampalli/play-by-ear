import { RelativeNote } from '../types/music';

export const CHORD_DICTIONARY: Record<string, RelativeNote[]> = {
  I: [
    { degree: 0, offset: -1 }, // C3
    { degree: 4, offset: -1 }, // E3
    { degree: 7, offset: -1 }, // G3
  ],
  IV: [
    { degree: 0, offset: -1 }, // C3
    { degree: 5, offset: -1 }, // F3
    { degree: 9, offset: -1 }, // A3
  ],
  V: [
    { degree: 11, offset: -2 }, // B2
    { degree: 2, offset: -1 },  // D3
    { degree: 7, offset: -1 },  // G3
  ],
};

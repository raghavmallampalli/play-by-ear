import { BaseLevel } from './base_level';
import { LevelSetup } from '../types/levels';
import { PlayedNote, PlayedChord } from '../types/music';
import { CHORD_DICTIONARY } from './labels';

type ChordName = 'I' | 'IV' | 'V';

const CHORD_TIMELINE: { name: ChordName; beat: number; duration: number }[] = [
  { name: 'I', beat: 0, duration: 2736 }, // 3.6s
  { name: 'V', beat: 2880, duration: 1824 }, // 2.4s
  { name: 'I', beat: 4800, duration: 1824 }, // 2.4s
  { name: 'IV', beat: 6720, duration: 1824 }, // 2.4s
  { name: 'I', beat: 8640, duration: 912 }, // 1.2s
  { name: 'V', beat: 9600, duration: 912 }, // 1.2s
  { name: 'I', beat: 10560, duration: 2736 }, // 3.6s
];

const HB_MELODY: PlayedNote[] = [
  { note: { degree: 7, offset: 0 }, beat: 0, duration: 197 },
  { note: { degree: 7, offset: 0 }, beat: 240, duration: 197 },
  { note: { degree: 9, offset: 0 }, beat: 480, duration: 394 },
  { note: { degree: 7, offset: 0 }, beat: 960, duration: 394 },
  { note: { degree: 0, offset: 1 }, beat: 1440, duration: 394 },
  { note: { degree: 11, offset: 0 }, beat: 1920, duration: 787 },

  { note: { degree: 7, offset: 0 }, beat: 2880, duration: 197 },
  { note: { degree: 7, offset: 0 }, beat: 3120, duration: 197 },
  { note: { degree: 9, offset: 0 }, beat: 3360, duration: 394 },
  { note: { degree: 7, offset: 0 }, beat: 3840, duration: 394 },
  { note: { degree: 2, offset: 1 }, beat: 4320, duration: 394 },
  { note: { degree: 0, offset: 1 }, beat: 4800, duration: 787 },

  { note: { degree: 7, offset: 0 }, beat: 5760, duration: 197 },
  { note: { degree: 7, offset: 0 }, beat: 6000, duration: 197 },
  { note: { degree: 7, offset: 1 }, beat: 6240, duration: 394 },
  { note: { degree: 4, offset: 1 }, beat: 6720, duration: 394 },
  { note: { degree: 0, offset: 1 }, beat: 7200, duration: 394 },
  { note: { degree: 11, offset: 0 }, beat: 7680, duration: 394 },
  { note: { degree: 9, offset: 0 }, beat: 8160, duration: 787 },

  { note: { degree: 5, offset: 1 }, beat: 9120, duration: 197 },
  { note: { degree: 5, offset: 1 }, beat: 9360, duration: 197 },
  { note: { degree: 4, offset: 1 }, beat: 9600, duration: 394 },
  { note: { degree: 0, offset: 1 }, beat: 10080, duration: 394 },
  { note: { degree: 2, offset: 1 }, beat: 10560, duration: 394 },
  { note: { degree: 0, offset: 1 }, beat: 11040, duration: 1181 },
];

export class Level6 extends BaseLevel {
  public readonly isChordLevel = true;

  constructor() {
    super({
      id: 6,
      bpm: 100,
      tonic: 0, // C
      octave: 4,
      answerChoices: ['I', 'IV', 'V'],
    });
  }

  build(): LevelSetup {
    const melody = HB_MELODY;
    const chords: PlayedChord[] = [];
    const chordLabels: string[] = [];

    // Chord accompaniment
    for (const item of CHORD_TIMELINE) {
      const chordNotes = CHORD_DICTIONARY[item.name];
      chords.push({
        notes: chordNotes,
        beat: item.beat,
        duration: item.duration,
      });
      chordLabels.push(item.name);
    }

    const preloadMidi = [
      ...new Set([
        ...Object.values(CHORD_DICTIONARY)
          .flat()
          .map((n) => this.converter.toMidi(n)),
        ...HB_MELODY.map((n) => this.converter.toMidi(n.note)),
      ]),
    ];

    return {
      melody,
      chords,
      slots: this.createSlotsFromChords(chords, chordLabels),
      ...this.getCommonSetup(),
      preloadMidi,
    };
  }
}

const levelInstance = new Level6();
export const buildLevel6 = () => levelInstance.build();
export const LEVEL6_ANSWER_CHOICES = levelInstance.answerChoices;

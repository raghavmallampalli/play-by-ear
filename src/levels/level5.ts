import { BaseLevel } from './base_level';
import { LevelSetup } from '../types/levels';
import { PlayedNote, PlayedChord, RelativeNote } from '../types/music';
import { CHORD_DICTIONARY } from './labels';

const MELODY_NOTES: Record<string, RelativeNote> = {
  I: { degree: 9, offset: 0 }, // A4
  IV: { degree: 0, offset: 1 }, // C5
  V: { degree: 11, offset: 0 }, // B4
};

export class Level5 extends BaseLevel {
  public readonly isChordLevel = true;

  constructor() {
    super({
      id: 5,
      bpm: 100,
      tonic: 0, // C
      octave: 4,
      answerChoices: ['I', 'IV', 'V'],
    });
  }

  build(): LevelSetup {
    const choices = this.answerChoices;
    const melody: PlayedNote[] = [];
    const chords: PlayedChord[] = [];
    const chordLabels: string[] = [];

    for (let i = 0; i < 5; i++) {
      const chordLabel = choices[Math.floor(Math.random() * choices.length)];
      const timeSeconds = i * 2.6;
      const baseTick = this.converter.secondsToTicks(timeSeconds);

      // Chord layer
      const chordPitches = CHORD_DICTIONARY[chordLabel];

      chords.push({
        notes: chordPitches,
        beat: baseTick,
        duration: this.converter.secondsToTicks(2.2),
      });
      chordLabels.push(chordLabel);

      // Melody note (slightly later)
      const melodyNote = MELODY_NOTES[chordLabel];
      const melodyTick = baseTick + this.converter.secondsToTicks(0.12);
      melody.push({
        note: melodyNote,
        beat: melodyTick,
        duration: this.converter.secondsToTicks(1.6),
      });
    }

    const preloadMidi = [
      ...new Set([
        ...Object.values(CHORD_DICTIONARY)
          .flat()
          .map((n) => this.converter.toMidi(n)),
        ...Object.values(MELODY_NOTES).map((n) => this.converter.toMidi(n)),
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

const levelInstance = new Level5();
export const buildLevel5 = () => levelInstance.build();
export const LEVEL5_ANSWER_CHOICES = levelInstance.answerChoices;

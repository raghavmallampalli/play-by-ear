import { BaseLevel } from './base_level';
import { LevelSetup } from '../types/levels';
import { PlayedNote, PlayedChord, RelativeNote } from '../types/music';

/**
 * Level 2: upper tetrachord — degrees 5 6 7 1(octave).
 * Notes sit in the 4th/5th octave range.
 */
const CHOICES: RelativeNote[] = [
  { degree: 7, offset: 0 }, // G4
  { degree: 9, offset: 0 }, // A4
  { degree: 11, offset: 0 }, // B4
  { degree: 0, offset: 1 }, // C5
];

export class Level2 extends BaseLevel {
  public readonly isChordLevel = false;

  constructor() {
    super({
      id: 2,
      bpm: 120,
      tonic: 0, // C
      octave: 4,
      answerChoices: ['5', '6', '7', '1'],
    });
  }

  build(): LevelSetup {
    const melody: PlayedNote[] = [];
    const chords: PlayedChord[] = [];

    for (let i = 0; i < 5; i++) {
      const pick = CHOICES[Math.floor(Math.random() * CHOICES.length)];
      const timeSeconds = i * 0.55;
      const beat = this.converter.secondsToTicks(timeSeconds);
      const duration = this.converter.secondsToTicks(0.4);
      
      melody.push({ note: pick, beat, duration });
    }

    return {
      melody,
      chords,
      slots: this.createSlotsFromMelody(melody),
      ...this.getCommonSetup(),
      preloadMidi: CHOICES.map(c => this.converter.toMidi(c)),
    };
  }
}

const levelInstance = new Level2();
export const buildLevel2 = () => levelInstance.build();
export const LEVEL2_ANSWER_CHOICES = levelInstance.answerChoices;

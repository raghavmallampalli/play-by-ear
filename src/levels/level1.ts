import { BaseLevel } from './base_level';
import { LevelSetup } from '../types/levels';
import { PlayedNote, PlayedChord, RelativeNote } from '../types/music';

/** Level 1: lower tetrachord — degrees 1 2 3 4. */
const CHOICES: RelativeNote[] = [
  { degree: 0, offset: 0 }, // C4
  { degree: 2, offset: 0 }, // D4
  { degree: 4, offset: 0 }, // E4
  { degree: 5, offset: 0 }, // F4
];

export class Level1 extends BaseLevel {
  public readonly isChordLevel = false;

  constructor() {
    super({
      id: 1,
      bpm: 120,
      tonic: 0, // C
      octave: 4,
      answerChoices: ['1', '2', '3', '4'],
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

const levelInstance = new Level1();
export const buildLevel1 = () => levelInstance.build();
export const LEVEL1_ANSWER_CHOICES = levelInstance.answerChoices;

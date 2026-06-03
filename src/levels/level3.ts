import { BaseLevel } from './base_level';
import { LevelSetup } from '../types/levels';
import { PlayedNote, PlayedChord } from '../types/music';

// Happy Birthday melody defined directly as standard PlayedNotes (times in ticks at 100 BPM, 480 PPQ)
const BIRTHDAY_MELODY: PlayedNote[] = [
  { note: { degree: 0, offset: 0 }, beat: 0, duration: 200 }, // C4
  { note: { degree: 0, offset: 0 }, beat: 320, duration: 120 }, // C4
  { note: { degree: 2, offset: 0 }, beat: 480, duration: 360 }, // D4
  { note: { degree: 0, offset: 0 }, beat: 960, duration: 360 }, // C4
  { note: { degree: 5, offset: 0 }, beat: 1440, duration: 360 }, // F4
  { note: { degree: 4, offset: 0 }, beat: 1920, duration: 720 }, // E4
];

export class Level3 extends BaseLevel {
  public readonly isChordLevel = false;

  constructor() {
    super({
      id: 3,
      bpm: 100,
      tonic: 0, // C
      octave: 4,
      answerChoices: ['1', '2', '3', '4', '5', '6', '7', '8'],
    });
  }

  build(): LevelSetup {
    const melody = BIRTHDAY_MELODY;
    const chords: PlayedChord[] = [];

    return {
      melody,
      chords,
      slots: this.createSlotsFromMelody(melody),
      ...this.getCommonSetup(),
      preloadMidi: [60, 62, 64, 65, 67, 69, 71, 72],
    };
  }
}

const levelInstance = new Level3();
export const buildLevel3 = () => levelInstance.build();
export const LEVEL3_ANSWER_CHOICES = levelInstance.answerChoices;

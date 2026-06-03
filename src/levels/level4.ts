import { BaseLevel } from './base_level';
import { LevelSetup } from '../types/levels';
import { PlayedNote, PlayedChord } from '../types/music';
import { CHORD_DICTIONARY } from './labels';

export class Level4 extends BaseLevel {
  public readonly isChordLevel = true;

  constructor() {
    super({
      id: 4,
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
      const timeSeconds = i * 1.4;
      const baseTick = this.converter.secondsToTicks(timeSeconds);
      const notes = CHORD_DICTIONARY[chordLabel];

      chords.push({
        notes,
        beat: baseTick,
        duration: this.converter.secondsToTicks(1.1),
      });
      chordLabels.push(chordLabel);
    }

    const preloadMidi = [
      ...new Set(
        Object.values(CHORD_DICTIONARY)
          .flat()
          .map((n) => this.converter.toMidi(n)),
      ),
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

const levelInstance = new Level4();
export const buildLevel4 = () => levelInstance.build();
export const LEVEL4_ANSWER_CHOICES = levelInstance.answerChoices;

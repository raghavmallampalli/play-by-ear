import { LevelSetup, TimelineSlot } from '../types/levels';
import { RelativeNote, PlayedNote, PlayedChord } from '../types/music';
import { NoteConverter } from '../utils/note_converter';

/** Configuration interface for naming level parameters cleanly. */
export interface BaseLevelConfig {
  id: number;
  bpm: number;
  tonic: number;
  octave: number;
  answerChoices: string[];
  ticksPerBeat?: number;
}

/**
 * BaseLevel
 * An abstract base class for all ear trainer levels.
 * Minimizes boilerplate by consolidating common level configurations,
 * initializing the NoteConverter, and standardizing the LevelSetup structure.
 */
export abstract class BaseLevel {
  public readonly id: number;
  public readonly bpm: number;
  public readonly tonic: number;
  public readonly octave: number;
  public readonly answerChoices: string[];
  public readonly ticksPerBeat: number;
  public readonly converter: NoteConverter;
  public abstract readonly isChordLevel: boolean;

  constructor(config: BaseLevelConfig) {
    this.id = config.id;
    this.bpm = config.bpm;
    this.tonic = config.tonic;
    this.octave = config.octave;
    this.answerChoices = config.answerChoices;
    this.ticksPerBeat = config.ticksPerBeat ?? 480;
    this.converter = new NoteConverter(this.tonic, this.octave, this.bpm, this.ticksPerBeat);
  }

  /** Generates a fresh, dynamic instance of the exercise (notes + slots). */
  abstract build(): LevelSetup;

  /** Infers the scale degree or Roman numeral label dynamically from a RelativeNote. */
  public inferLabel(note: RelativeNote): string {
    if (this.isChordLevel) {
      // Chord Roman Numeral based on its root pitch class
      if (note.degree === 0) return 'I';
      if (note.degree === 5) return 'IV';
      if (note.degree === 7) return 'V';
      return '';
    } else {
      // Scale Degrees (levels 1-3)
      if (note.degree === 0 && note.offset === 1) return '1';
      if (note.degree === 0) return '1';
      if (note.degree === 2) return '2';
      if (note.degree === 4) return '3';
      if (note.degree === 5) return '4';
      if (note.degree === 7) return '5';
      if (note.degree === 9) return '6';
      if (note.degree === 11) return '7';
      return '';
    }
  }

  /** Generates standardized timeline slots directly from a list of melody PlayedNotes. */
  protected createSlotsFromMelody(melody: PlayedNote[]): TimelineSlot[] {
    return melody.map((n) => ({
      note: n.note,
      beat: n.beat,
      answer: null,
      correct: false,
      label: this.inferLabel(n.note),
    }));
  }

  /** Generates standardized timeline slots directly from a list of PlayedChords and their labels. */
  protected createSlotsFromChords(chords: PlayedChord[], chordLabels: string[]): TimelineSlot[] {
    return chords.map((c, i) => {
      const chordLabel = chordLabels[i];
      return {
        note: c.notes[0],
        beat: c.beat,
        answer: null,
        correct: false,
        label: this.inferLabel(c.notes[0]),
        chord: chordLabel,
      };
    });
  }

  /** Standard helper to populate default metadata properties of LevelSetup. */
  protected getCommonSetup(): Pick<LevelSetup, 'bpm' | 'ticksPerBeat' | 'tonicPitchClass' | 'baseOctave'> {
    return {
      bpm: this.bpm,
      ticksPerBeat: this.ticksPerBeat,
      tonicPitchClass: this.tonic,
      baseOctave: this.octave,
    };
  }
}

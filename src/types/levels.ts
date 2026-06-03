import { PlayedNote, PlayedChord, RelativeNote } from '../types/music';

/** A slot on the DAW timeline the user needs to answer. */
export interface TimelineSlot {
  note: RelativeNote;
  /** Start time in ticks. */
  beat: number;
  answer: string | null;
  correct: boolean;
  label: string;
  chord?: string;
}

/** The resolved output of a level setup function. */
export interface LevelSetup {
  /** The sequence of melody notes for the exercise. */
  melody: PlayedNote[];
  /** The sequence of backing chords. */
  chords: PlayedChord[];
  /** Interative slots on the timeline the user must solve. */
  slots: TimelineSlot[];

  bpm: number;
  /** Resolution for the tick-based timing system. */
  ticksPerBeat: number;

  /** Pitch class of the tonic (0 = C, 1 = C#, … 11 = B). */
  tonicPitchClass: number;
  /** Base octave for the exercise (e.g., 4 for Middle C). */
  baseOctave: number;

  /** All absolute MIDI pitches that should be preloaded for this level. */
  preloadMidi: number[];
}

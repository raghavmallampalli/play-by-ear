import { LevelSetup, TimelineSlot } from '../types/levels';
import { PlayedNote, PlayedChord, RelativeNote } from '../types/music';
import { NoteConverter } from '../utils/note_converter';
import { CHORD_DICTIONARY } from '../constants/chords';

const TICKS_PER_BEAT = 480;
const BPM = 100;
const TONIC = 0; // C
const OCTAVE = 4;

const converter = new NoteConverter(TONIC, OCTAVE, BPM, TICKS_PER_BEAT);


const MELODY_NOTES: Record<string, RelativeNote> = {
  I: { degree: 9, offset: 0 },  // A4
  IV: { degree: 0, offset: 1 }, // C5
  V: { degree: 11, offset: 0 }, // B4
};

export const LEVEL5_ANSWER_CHOICES = ['I', 'IV', 'V'];

export function buildLevel5(): LevelSetup {
  const choices = ['I', 'IV', 'V'] as const;
  const melody: PlayedNote[] = [];
  const chords: PlayedChord[] = [];
  const slots: TimelineSlot[] = [];

  for (let i = 0; i < 5; i++) {
    const chordLabel = choices[Math.floor(Math.random() * choices.length)];
    const timeSeconds = i * 2.6;
    const baseTick = converter.secondsToTicks(timeSeconds);
    
    // Chord layer
    const chordPitches = CHORD_DICTIONARY[chordLabel];

    chords.push({
      notes: chordPitches,
      beat: baseTick,
      duration: converter.secondsToTicks(2.2),
    });

    // Melody note (slightly later)
    const melodyNote = MELODY_NOTES[chordLabel];
    const melodyTick = baseTick + converter.secondsToTicks(0.12);
    melody.push({
      note: melodyNote,
      beat: melodyTick,
      duration: converter.secondsToTicks(1.6),
    });

    slots.push({
      note: chordPitches[0],
      beat: baseTick,
      answer: null,
      correct: false,
      label: chordLabel,
      chord: chordLabel,
    });
  }

  const preloadMidi = [...new Set([
    ...Object.values(CHORD_DICTIONARY).flat().map(n => converter.toMidi(n)),
    ...Object.values(MELODY_NOTES).map(n => converter.toMidi(n)),
  ])];

  return {
    melody,
    chords,
    slots,
    bpm: BPM,
    ticksPerBeat: TICKS_PER_BEAT,
    tonicPitchClass: TONIC,
    baseOctave: OCTAVE,
    preloadMidi,
  };
}

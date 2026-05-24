import { LevelSetup, TimelineSlot } from '../types/levels';
import { PlayedNote, PlayedChord, RelativeNote } from '../types/music';
import { NoteConverter } from '../utils/note_converter';
import { CHORD_DICTIONARY } from '../constants/chords';

const TICKS_PER_BEAT = 480;
const BPM = 100;
const TONIC = 0; // C
const OCTAVE = 4;

const converter = new NoteConverter(TONIC, OCTAVE, BPM, TICKS_PER_BEAT);


export const LEVEL4_ANSWER_CHOICES = ['I', 'IV', 'V'];

export function buildLevel4(): LevelSetup {
  const choices = ['I', 'IV', 'V'] as const;
  const melody: PlayedNote[] = [];
  const chords: PlayedChord[] = [];
  const slots: TimelineSlot[] = [];

  for (let i = 0; i < 5; i++) {
    const chordLabel = choices[Math.floor(Math.random() * choices.length)];
    const timeSeconds = i * 1.4;
    const baseTick = converter.secondsToTicks(timeSeconds);
    const notes = CHORD_DICTIONARY[chordLabel];

    // Also add to chords for the engine
    chords.push({
      notes,
      beat: baseTick,
      duration: converter.secondsToTicks(1.1),
    });

    slots.push({
      note: notes[0],
      beat: baseTick,
      answer: null,
      correct: false,
      label: chordLabel,
      chord: chordLabel,
    });
  }

  const preloadMidi = [...new Set(Object.values(CHORD_DICTIONARY).flat().map(n => converter.toMidi(n)))];
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

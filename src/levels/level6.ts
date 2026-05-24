import { LevelSetup, TimelineSlot } from '../types/levels';
import { PlayedNote, PlayedChord, RelativeNote } from '../types/music';
import { NoteConverter } from '../utils/note_converter';
import { CHORD_DICTIONARY } from '../constants/chords';

const TICKS_PER_BEAT = 480;
const BPM = 100;
const TONIC = 0; // C
const OCTAVE = 4;

const converter = new NoteConverter(TONIC, OCTAVE, BPM, TICKS_PER_BEAT);


type ChordName = 'I' | 'IV' | 'V';

const CHORD_TIMELINE: [ChordName, number, number][] = [
  ['I',  0.0,  3.6],
  ['V',  3.6,  2.4],
  ['I',  6.0,  2.4],
  ['IV', 8.4,  2.4],
  ['I',  10.8, 1.2],
  ['V',  12.0, 1.2],
  ['I',  13.2, 3.6],
];

const HB_MELODY: [{ degree: number, offset: number }, number][] = [
  [{ degree: 0, offset: 0 }, 0.3], [{ degree: 0, offset: 0 }, 0.3], [{ degree: 2, offset: 0 }, 0.6], [{ degree: 0, offset: 0 }, 0.6], [{ degree: 5, offset: 0 }, 0.6], [{ degree: 4, offset: 0 }, 1.2],
  [{ degree: 0, offset: 0 }, 0.3], [{ degree: 0, offset: 0 }, 0.3], [{ degree: 2, offset: 0 }, 0.6], [{ degree: 0, offset: 0 }, 0.6], [{ degree: 7, offset: 0 }, 0.6], [{ degree: 5, offset: 0 }, 1.2],
  [{ degree: 0, offset: 0 }, 0.3], [{ degree: 0, offset: 0 }, 0.3], [{ degree: 0, offset: 1 }, 0.6], [{ degree: 9, offset: 0 }, 0.6], [{ degree: 5, offset: 0 }, 0.6], [{ degree: 4, offset: 0 }, 0.6], [{ degree: 2, offset: 0 }, 1.2],
  [{ degree: 11, offset: 0 }, 0.3], [{ degree: 11, offset: 0 }, 0.3], [{ degree: 9, offset: 0 }, 0.6], [{ degree: 5, offset: 0 }, 0.6], [{ degree: 7, offset: 0 }, 0.6], [{ degree: 5, offset: 0 }, 1.8],
];

export const LEVEL6_ANSWER_CHOICES = ['I', 'IV', 'V'];

export function buildLevel6(): LevelSetup {
  const melody: PlayedNote[] = [];
  const chords: PlayedChord[] = [];
  const slots: TimelineSlot[] = [];

  // Chord accompaniment
  for (const [chordName, time, dur] of CHORD_TIMELINE) {
    const chordNotes = CHORD_DICTIONARY[chordName];

    const baseTick = converter.secondsToTicks(time);
    const duration = converter.secondsToTicks(dur);

    chords.push({
      notes: chordNotes,
      beat: baseTick,
      duration: Math.round(duration * 0.95),
    });

    slots.push({
      note: chordNotes[0],
      beat: baseTick,
      answer: null,
      correct: false,
      label: chordName,
      chord: chordName,
    });
  }

  // Melody on top
  let cursor = 0;
  for (const [relNote, dur] of HB_MELODY) {
    const beat = converter.secondsToTicks(cursor);
    const duration = converter.secondsToTicks(dur);
    melody.push({
      note: relNote,
      beat,
      duration: Math.round(duration * 0.82),
    });
    cursor += dur;
  }

  const preloadMidi = [...new Set([
    ...Object.values(CHORD_DICTIONARY).flat().map(n => converter.toMidi(n)),
    ...HB_MELODY.map(([n]) => converter.toMidi(n)),
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

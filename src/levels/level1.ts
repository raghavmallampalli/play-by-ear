import { LevelSetup, TimelineSlot } from '../types/levels';
import { PlayedNote, PlayedChord } from '../types/music';
import { NoteConverter } from '../utils/note_converter';

const TICKS_PER_BEAT = 480;
const BPM = 120;
const TONIC = 0; // C
const OCTAVE = 4;

const converter = new NoteConverter(TONIC, OCTAVE, BPM, TICKS_PER_BEAT);

/** Level 1: lower tetrachord — degrees 1 2 3 4. */
const CHOICES = [
  { degree: 0, label: '1' }, // C4
  { degree: 2, label: '2' }, // D4
  { degree: 4, label: '3' }, // E4
  { degree: 5, label: '4' }, // F4
];

export const LEVEL1_ANSWER_CHOICES = ['1', '2', '3', '4'];

export function buildLevel1(): LevelSetup {
  const melody: PlayedNote[] = [];
  const chords: PlayedChord[] = [];
  const slots: TimelineSlot[] = [];

  for (let i = 0; i < 5; i++) {
    const pick = CHOICES[Math.floor(Math.random() * CHOICES.length)];
    const timeSeconds = i * 0.55;
    const beat = converter.secondsToTicks(timeSeconds);
    const duration = converter.secondsToTicks(0.4);
    
    const note = { note: { degree: pick.degree, offset: 0 }, beat, duration };
    melody.push(note);
    slots.push({ note: note.note, beat, answer: null, correct: false, label: pick.label });
  }

  return {
    melody,
    chords,
    slots,
    bpm: BPM,
    ticksPerBeat: TICKS_PER_BEAT,
    tonicPitchClass: TONIC,
    baseOctave: OCTAVE,
    preloadMidi: CHOICES.map(c => converter.toMidi({ degree: c.degree, offset: 0 })),
  };
}

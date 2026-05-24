import { LevelSetup, TimelineSlot } from '../types/levels';
import { PlayedNote, PlayedChord } from '../types/music';
import { NoteConverter } from '../utils/note_converter';

const TICKS_PER_BEAT = 480;
const BPM = 100;
const TONIC = 0; // C
const OCTAVE = 4;

const converter = new NoteConverter(TONIC, OCTAVE, BPM, TICKS_PER_BEAT);

/**
 * Level 3: Melody dictation — placeholder.
 * Uses all 7 scale degrees.
 */
const CHOICES = [
  { degree: 0, offset: 0, label: '1' }, // C4
  { degree: 2, offset: 0, label: '2' }, // D4
  { degree: 4, offset: 0, label: '3' }, // E4
  { degree: 5, offset: 0, label: '4' }, // F4
  { degree: 7, offset: 0, label: '5' }, // G4
  { degree: 9, offset: 0, label: '6' }, // A4
  { degree: 11, offset: 0, label: '7' }, // B4
];

export const LEVEL3_ANSWER_CHOICES = ['1', '2', '3', '4', '5', '6', '7'];

export function buildLevel3(): LevelSetup {
  const melody: PlayedNote[] = [];
  const chords: PlayedChord[] = [];
  const slots: TimelineSlot[] = [];

  for (let i = 0; i < 7; i++) {
    const pick = CHOICES[Math.floor(Math.random() * CHOICES.length)];
    const timeSeconds = i * 0.6;
    const beat = converter.secondsToTicks(timeSeconds);
    const duration = converter.secondsToTicks(0.45);
    
    const note = { note: { degree: pick.degree, offset: pick.offset }, beat, duration };
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
    preloadMidi: CHOICES.map(c => converter.toMidi({ degree: c.degree, offset: c.offset })),
  };
}

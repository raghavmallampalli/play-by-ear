import { LevelSetup, TimelineSlot } from '../types/levels';
import { PlayedNote, PlayedChord } from '../types/music';
import { NoteConverter } from '../utils/note_converter';

const TICKS_PER_BEAT = 480;
const BPM = 120;
const TONIC = 0; // C
const OCTAVE = 4;

const converter = new NoteConverter(TONIC, OCTAVE, BPM, TICKS_PER_BEAT);

/**
 * Level 2: upper tetrachord — degrees 5 6 7 1(octave).
 * Notes sit in the 4th/5th octave range.
 */
const CHOICES = [
  { degree: 7, offset: 0, label: '5' }, // G4
  { degree: 9, offset: 0, label: '6' }, // A4
  { degree: 11, offset: 0, label: '7' }, // B4
  { degree: 0, offset: 1, label: '1' }, // C5
];

export const LEVEL2_ANSWER_CHOICES = ['5', '6', '7', '1'];

export function buildLevel2(): LevelSetup {
  const melody: PlayedNote[] = [];
  const chords: PlayedChord[] = [];
  const slots: TimelineSlot[] = [];

  for (let i = 0; i < 5; i++) {
    const pick = CHOICES[Math.floor(Math.random() * CHOICES.length)];
    const timeSeconds = i * 0.55;
    const beat = converter.secondsToTicks(timeSeconds);
    const duration = converter.secondsToTicks(0.4);
    
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

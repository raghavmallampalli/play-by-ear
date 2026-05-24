import { LevelSetup, TimelineSlot } from '../types/levels';
import { PlayedNote, PlayedChord } from '../types/music';
import { NoteConverter } from '../utils/note_converter';

const TICKS_PER_BEAT = 480;
const BPM = 100;
const TONIC = 0; // C
const OCTAVE = 4;

const converter = new NoteConverter(TONIC, OCTAVE, BPM, TICKS_PER_BEAT);

export const LEVEL3_ANSWER_CHOICES = ['1', '2', '3', '4', '5', '6', '7'];

const BIRTHDAY_NOTES = [
  { degree: 0, offset: 0, label: '1', time: 0.0, duration: 0.25 }, // C4
  { degree: 0, offset: 0, label: '1', time: 0.4, duration: 0.15 }, // C4
  { degree: 2, offset: 0, label: '2', time: 0.6, duration: 0.45 }, // D4
  { degree: 0, offset: 0, label: '1', time: 1.2, duration: 0.45 }, // C4
  { degree: 5, offset: 0, label: '4', time: 1.8, duration: 0.45 }, // F4
  { degree: 4, offset: 0, label: '3', time: 2.4, duration: 0.90 }, // E4
];

export function buildLevel3(): LevelSetup {
  const melody: PlayedNote[] = [];
  const chords: PlayedChord[] = [];
  const slots: TimelineSlot[] = [];

  BIRTHDAY_NOTES.forEach((n) => {
    const beat = converter.secondsToTicks(n.time);
    const duration = converter.secondsToTicks(n.duration);
    
    const note = { note: { degree: n.degree, offset: n.offset }, beat, duration };
    melody.push(note);
    slots.push({ note: note.note, beat, answer: null, correct: false, label: n.label });
  });

  return {
    melody,
    chords,
    slots,
    bpm: BPM,
    ticksPerBeat: TICKS_PER_BEAT,
    tonicPitchClass: TONIC,
    baseOctave: OCTAVE,
    preloadMidi: [60, 62, 64, 65, 67, 69, 71, 72],
  };
}

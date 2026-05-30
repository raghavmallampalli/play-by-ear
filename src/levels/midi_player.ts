import { PlayedNote, PlayedChord } from '../types/music';
import { NoteConverter } from '../utils/note_converter';

const TICKS_PER_BEAT = 480;
const BPM = 120;
const TONIC = 0;
const OCTAVE = 4;
const converter = new NoteConverter(TONIC, OCTAVE, BPM, TICKS_PER_BEAT);

/** Full midi_player demo: chord + melody layers across 4 bars. */
export function buildMidiPlayerDemoNotes(): { melody: PlayedNote[], chords: PlayedChord[] } {
  const melody: PlayedNote[] = [];
  const chords: PlayedChord[] = [];

  const addBar = (time: number, chordMidis: number[], melodyMidis: number[], duration: number) => {
    const baseTick = converter.secondsToTicks(time);
    const durationTicks = converter.secondsToTicks(duration);
    
    const relChordNotes = chordMidis.map(m => converter.fromMidi(m));
    chords.push({
      notes: relChordNotes,
      beat: baseTick,
      duration: Math.round(durationTicks * 0.98),
    });

    // Add chord notes to melody for visualization/scheduling too
    relChordNotes.forEach(note => {
      melody.push({
        note,
        beat: baseTick,
        duration: Math.round(durationTicks * 0.98),
      });
    });

    const step = duration / melodyMidis.length;
    melodyMidis.forEach((m, i) => {
      melody.push({
        note: converter.fromMidi(m),
        beat: converter.secondsToTicks(time + i * step),
        duration: converter.secondsToTicks(step * 0.85),
      });
    });
  };

  addBar(0.0, [48, 55, 60, 64, 67, 71], [72, 76, 79, 83], 3.0);
  addBar(3.0, [45, 52, 57, 60, 64, 67], [81, 79, 76, 72], 3.0);
  addBar(6.0, [41, 48, 53, 57, 60, 64, 69], [77, 81, 84, 88], 3.0);
  addBar(9.0, [43, 50, 55, 59, 62, 65, 67], [79, 77, 74, 71], 3.0);

  return { melody, chords };
}

export const MIDI_PLAYER_PRELOAD_MIDI = [
  48, 55, 60, 64, 67, 71, 72, 76, 79, 83,
  45, 52, 57, 81,
  41, 48, 53, 69, 77, 84, 88,
  43, 50, 59, 62, 65, 74,
];

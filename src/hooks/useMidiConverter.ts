import { Midi } from '@tonejs/midi';
import { NoteConverter } from '../utils/note_converter';
import { Song, RelativeNote, PlayedNote, PlayedChord } from '../types/music';

/**
 * useMidiConverter
 * Provides utilities to convert between raw MIDI data and our relative Song format.
 */
export function useMidiConverter(converter: NoteConverter) {
  /**
   * Converts a MIDI file buffer into a Relative Song.
   * - Track 0 or the largest non-percussion track is usually the melody.
   * - Other tracks are grouped into chords.
   * - Percussion (Channel 10) is ignored.
   */
  const midiToSong = (midiData: Uint8Array | ArrayBuffer): Song => {
    const midi = new Midi(midiData);
    const melody: PlayedNote[] = [];
    const chords: PlayedChord[] = [];

    midi.tracks.forEach((track) => {
      // Ignore percussion
      if (track.channel === 9 || track.channel === 10) return;

      track.notes.forEach((note) => {
        const relativeNote = converter.fromMidi(note.midi);
        // Note: note.ticks is the absolute start time in ticks
        // note.durationTicks is the length in ticks
        
        // We decide which notes go to melody vs chords based on track name or heuristics.
        // For this refactor, we'll treat all tracks as contributing to melody 
        // unless they are explicitly chordal. 
        // Simple heuristic: if multiple notes start at the exact same tick in a track, it's a chord.
        
        melody.push({
          note: relativeNote,
          beat: note.ticks,
          duration: note.durationTicks,
        });
      });
    });

    // Heuristic to group melody into chords for the 'chords' array
    // (In a real app, this would be more sophisticated or use track metadata)
    const notesByTick: Record<number, PlayedNote[]> = {};
    melody.forEach(n => {
      if (!notesByTick[n.beat]) notesByTick[n.beat] = [];
      notesByTick[n.beat].push(n);
    });

    Object.entries(notesByTick).forEach(([tickStr, notes]) => {
      if (notes.length > 1) {
        chords.push({
          notes: notes.map(n => n.note),
          beat: parseInt(tickStr),
          duration: Math.max(...notes.map(n => n.duration)),
        });
      }
    });

    return { melody, chords };
  };

  /**
   * Converts a Relative Song back into a MIDI file buffer.
   */
  const songToMidi = (song: Song): Uint8Array => {
    const midi = new Midi();
    midi.header.setTempo(converter.bpm);
    // @ts-ignore: ppq is internally writable despite types
    midi.header.ppq = converter.ticksPerBeat;

    const melodyTrack = midi.addTrack();
    melodyTrack.name = 'Melody';

    const uniqueNotes = new Set<string>();

    song.melody.forEach((n) => {
      const midiPitch = converter.toMidi(n.note);
      uniqueNotes.add(`${midiPitch}_${n.beat}`);
      melodyTrack.addNote({
        midi: midiPitch,
        ticks: n.beat,
        durationTicks: n.duration,
      });
    });

    const chordTrack = midi.addTrack();
    chordTrack.name = 'Chords';
    song.chords.forEach((c) => {
      c.notes.forEach(note => {
        const midiPitch = converter.toMidi(note);
        const key = `${midiPitch}_${c.beat}`;
        if (!uniqueNotes.has(key)) {
          uniqueNotes.add(key);
          chordTrack.addNote({
            midi: midiPitch,
            ticks: c.beat,
            durationTicks: c.duration,
          });
        }
      });
    });

    return midi.toArray();
  };

  return { midiToSong, songToMidi };
}

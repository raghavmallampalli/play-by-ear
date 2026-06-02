import { Midi } from '@tonejs/midi';
import { NoteConverter } from '../utils/note_converter';
import { useMidiConverter } from '../hooks/useMidiConverter';

describe('MIDI Roundtrip 1:1 Verification', () => {
  const converter = new NoteConverter(0, 4, 120, 480);
  const { midiToSong, songToMidi } = useMidiConverter(converter);

  test('MIDI -> Relative -> MIDI is bitwise identical for notes', () => {
    // 1. Create a source MIDI with complex timing
    const sourceMidi = new Midi();
    sourceMidi.header.setTempo(120);
    const track = sourceMidi.addTrack();
    
    // Note 1: Simple on-beat
    track.addNote({ midi: 60, ticks: 0, durationTicks: 480 });
    
    // Note 2, 3, 4: True simultaneous chord (C Major triad)
    track.addNote({ midi: 60, ticks: 480, durationTicks: 480 }); // Root (overlaps with melody note, but same time)
    track.addNote({ midi: 64, ticks: 480, durationTicks: 480 }); // Third
    track.addNote({ midi: 67, ticks: 480, durationTicks: 480 }); // Fifth
    
    const sourceBuffer = sourceMidi.toArray();

    // 2. Convert to our Relative format
    const song = midiToSong(sourceBuffer);

    // Verify song melody has 4 notes (since midiToSong puts everything in melody)
    expect(song.melody).toHaveLength(4);
    
    // Verify chords array captured the true chord
    expect(song.chords).toHaveLength(1);
    expect(song.chords[0].notes).toHaveLength(3);
    expect(song.chords[0].beat).toBe(480);

    // 3. Convert back to MIDI
    const resultBuffer = songToMidi(song);
    const resultMidi = new Midi(resultBuffer);

    // 4. Compare source notes with result notes
    // Note: songToMidi currently puts everything into 'Melody' and 'Chords' tracks.
    // Our midiToSong merged them into 'melody' array.
    // So we should compare the combined set of notes.
    
    const allResultNotes = resultMidi.tracks.flatMap(t => t.notes).sort((a, b) => a.ticks - b.ticks || a.midi - b.midi);
    const allSourceNotes = sourceMidi.tracks.flatMap(t => t.notes).sort((a, b) => a.ticks - b.ticks || a.midi - b.midi);

    expect(allResultNotes).toHaveLength(allSourceNotes.length);

    for (let i = 0; i < allSourceNotes.length; i++) {
      expect(allResultNotes[i].midi).toBe(allSourceNotes[i].midi);
      expect(allResultNotes[i].ticks).toBe(allSourceNotes[i].ticks);
      expect(allResultNotes[i].durationTicks).toBe(allSourceNotes[i].durationTicks);
    }
  });
});

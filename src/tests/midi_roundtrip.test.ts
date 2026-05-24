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
    // Note 2 & 3: Arpeggiated chord (small offset)
    track.addNote({ midi: 64, ticks: 480, durationTicks: 480 });
    track.addNote({ midi: 67, ticks: 490, durationTicks: 470 }); // 10 tick offset
    
    const sourceBuffer = sourceMidi.toArray();

    // 2. Convert to our Relative format
    const song = midiToSong(sourceBuffer);

    // Verify song has 3 notes in melody
    expect(song.melody).toHaveLength(3);
    expect(song.melody[2].beat).toBe(490); // Verified offset preserved

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

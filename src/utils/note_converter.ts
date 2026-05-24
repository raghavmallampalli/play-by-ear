import { RelativeNote } from '../types/music';

/**
 * NoteConverter
 * Handles bidirectional conversion between relative notes and MIDI,
 * and between ticks and seconds.
 */
export class NoteConverter {
  constructor(
    public readonly tonicPitchClass: number, // 0-11 (C=0)
    public readonly baseOctave: number,      // e.g. 4 for Middle C
    public readonly bpm: number,
    public readonly ticksPerBeat: number = 480
  ) {}

  /**
   * Converts a RelativeNote to an absolute MIDI pitch.
   * MIDI = (baseOctave + 1) * 12 + tonicPitchClass + degree + (offset * 12)
   */
  toMidi(note: RelativeNote): number {
    const baseMidi = (this.baseOctave + 1) * 12 + this.tonicPitchClass;
    return baseMidi + note.degree + (note.offset * 12);
  }

  /**
   * Converts an absolute MIDI pitch to a RelativeNote.
   * Reversible: midi === toMidi(fromMidi(midi))
   */
  fromMidi(midi: number): RelativeNote {
    const baseMidi = (this.baseOctave + 1) * 12 + this.tonicPitchClass;
    const diff = midi - baseMidi;
    
    // degree should be 0-11
    let degree = diff % 12;
    if (degree < 0) degree += 12;
    
    const offset = Math.floor(diff / 12);
    
    return { degree, offset };
  }

  /**
   * Converts ticks to seconds.
   * seconds = ticks * (60 / (bpm * ticksPerBeat))
   */
  ticksToSeconds(ticks: number): number {
    return ticks * (60 / (this.bpm * this.ticksPerBeat));
  }

  /**
   * Converts seconds to ticks (quantized to integer).
   */
  secondsToTicks(seconds: number): number {
    return Math.round(seconds / (60 / (this.bpm * this.ticksPerBeat)));
  }
}

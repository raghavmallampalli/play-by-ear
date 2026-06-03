import { NoteConverter } from '../utils/note_converter';
import { PlayedChord, PlayedNote } from './music';

export interface AudioEngineOptions {
  mode: 'trainer' | 'progress' | 'midi_player';
  level: number;
  preloadMidi: number[];
}

export interface AudioEngine {
  isPlaying: boolean;
  playheadTime: number; // Still in seconds for UI/clamping
  activeNotes: number[];
  hasStarted: boolean;
  hasPlayedCadence: boolean;
  startPlayback: (
    melody: PlayedNote[],
    chords: PlayedChord[],
    converter: NoteConverter,
    skipCadence?: boolean,
    slotStates?: { melody: Map<number, boolean>; chord: Map<number, boolean> },
  ) => Promise<void>;
  pausePlayback: () => void;
  stopPlayback: () => void;
  triggerLiveNote: (midi: number, showHighlight?: boolean) => void;
  playChoiceAudio: (choice: string, converter: NoteConverter, showHighlight?: boolean) => void;
  playTonicRootChord: (converter: NoteConverter) => void;
  playGroundingCadence: (converter: NoteConverter) => void;
  playBackingChordsOnly: (
    chords: PlayedChord[],
    converter: NoteConverter,
    slotStates?: Map<number, boolean>,
  ) => void;
  playMelodyOnly: (
    melody: PlayedNote[],
    converter: NoteConverter,
    slotStates?: Map<number, boolean>,
  ) => void;
  resetStartFlags: () => void;
  setPlayheadTime: (t: number) => void;
  seekPlayback?: (time: number) => void;
  startDirectMidiPlayback?: (
    notes: { midi: number; time: number; duration: number; velocity: number }[],
    speed?: number,
  ) => void;
}

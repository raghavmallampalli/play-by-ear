import { PlayedNote, PlayedChord } from './music';
import { NoteConverter } from '../utils/note_converter';

export interface AudioEngineOptions {
  mode: 'trainer' | 'sandbox' | 'progress';
  level: number;
  preloadMidi: number[];
}

export interface AudioEngine {
  isPlaying: boolean;
  playheadTime: number; // Still in seconds for UI/clamping
  activeNotes: number[];
  hasStarted: boolean;
  hasPlayedCadence: boolean;
  startPlayback: (melody: PlayedNote[], chords: PlayedChord[], converter: NoteConverter, skipCadence?: boolean) => Promise<void>;
  pausePlayback: () => void;
  stopPlayback: () => void;
  triggerLiveNote: (midi: number, showHighlight?: boolean) => void;
  playChoiceAudio: (choice: string, converter: NoteConverter, showHighlight?: boolean) => void;
  playTonicRootChord: (converter: NoteConverter) => void;
  playGroundingCadence: (converter: NoteConverter) => void;
  playBackingChordsOnly: (chords: PlayedChord[], converter: NoteConverter) => void;
  playMelodyOnly: (melody: PlayedNote[], converter: NoteConverter) => void;
  resetStartFlags: () => void;
  setPlayheadTime: (t: number) => void;
}

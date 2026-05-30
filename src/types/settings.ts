import { MelodyLabelSystem, ChordLabelSystem } from './labels';

export interface AppSettings {
  instrumentMode: 'piano' | 'guitar';
  melodyLabelSystem: MelodyLabelSystem;
  chordLabelSystem: ChordLabelSystem;
  visualizerEnabled: boolean;
  tempoMap: Record<number, number>;
  midiTempoMap?: Record<string, number>;
  confirmRestartLevel: boolean;
}

export interface LevelConfig {
  bpm: number;
  tonic: number;
  octave: number;
  ticksPerBeat: number;
}

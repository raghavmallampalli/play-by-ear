import { MelodyLabelSystem, ChordLabelSystem } from './labels';

export interface AppSettings {
  instrumentMode: 'piano' | 'guitar';
  melodyLabelSystem: MelodyLabelSystem;
  chordLabelSystem: ChordLabelSystem;
  visualizerEnabled: boolean;
  tempoMap: Record<number, number>;
  confirmRestartLevel: boolean;
}

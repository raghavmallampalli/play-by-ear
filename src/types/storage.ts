import { AppSettings } from './settings';

/** Progress format per level based on the unique level hash. */
export interface LevelProgress {
  timesTried: number;
  averageSuccess: number;
  bestSuccess: number;
}

export interface UserProgressData {
  [exerciseHash: string]: LevelProgress;
}

/** Level-specific custom study notes. */
export interface UserNotesData {
  [key: string]: string;
}

/** Recent tracks state in MIDI Player. */
export interface RecentTrack {
  id: string;
  name: string;
  isPreset: boolean;
}

export interface ActiveTrackState {
  name: string;
  isPreset: boolean;
  presetId?: string;
}

/** Master structure saved and imported as a backup file. */
export interface AppDataBundle {
  settings: AppSettings;
  progress: UserProgressData;
  notes: UserNotesData;
  recentMidis: RecentTrack[];
  activeTrack: ActiveTrackState | null;
}

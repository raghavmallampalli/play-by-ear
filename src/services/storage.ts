import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { AppSettings } from '../types/settings';
import { AppDataBundle, UserProgressData, UserNotesData, RecentTrack, ActiveTrackState } from '../types/storage';
import { DEFAULT_MELODY_LABELS, DEFAULT_CHORD_LABELS } from '../levels/labels';
import { EXERCISE_HASHES } from '../constants/exercises';

const SETTINGS_FILE = `${FileSystem.documentDirectory}pbe_settings.json`;
const PROGRESS_FILE = `${FileSystem.documentDirectory}pbe_progress.json`;
const NOTES_FILE = `${FileSystem.documentDirectory}pbe_notes.json`;
const RECENT_MIDIS_FILE = `${FileSystem.documentDirectory}pbe_recent_midis.json`;
const ACTIVE_TRACK_FILE = `${FileSystem.documentDirectory}pbe_active_track.json`;

export const DEFAULT_SETTINGS: AppSettings = {
  instrumentMode: 'piano',
  melodyLabelSystem: DEFAULT_MELODY_LABELS,
  chordLabelSystem: DEFAULT_CHORD_LABELS,
  visualizerEnabled: true,
  tempoMap: {},
  midiTempoMap: {},
  confirmRestartLevel: true,
};

const isWeb = Platform.OS === 'web';

// HELPER: File Operations
async function safeReadJSON<T>(fileUri: string, webKey: string, defaultValue: T): Promise<T> {
  if (isWeb) {
    try {
      const val = localStorage.getItem(webKey);
      return val ? JSON.parse(val) : defaultValue;
    } catch {
      return defaultValue;
    }
  }
  try {
    const info = await FileSystem.getInfoAsync(fileUri);
    if (!info.exists) return defaultValue;
    const content = await FileSystem.readAsStringAsync(fileUri);
    return JSON.parse(content);
  } catch (err) {
    console.error(`[Storage] Failed to read ${webKey} from file:`, err);
    return defaultValue;
  }
}

async function safeWriteJSON<T>(fileUri: string, webKey: string, data: T): Promise<void> {
  if (isWeb) {
    try {
      localStorage.setItem(webKey, JSON.stringify(data));
    } catch (err) {
      console.error(`[Storage] Web write failed:`, err);
    }
    return;
  }
  try {
    await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`[Storage] File system write failed for ${webKey}:`, err);
  }
}

// STORAGE API
export const StorageService = {
  async loadAllData(): Promise<AppDataBundle> {
    const [settings, progress, notes, recentMidis, activeTrack] = await Promise.all([
      safeReadJSON<AppSettings>(SETTINGS_FILE, '@pbe_settings', DEFAULT_SETTINGS),
      safeReadJSON<UserProgressData>(PROGRESS_FILE, '@pbe_progress', {}),
      safeReadJSON<UserNotesData>(NOTES_FILE, '@pbe_notes', {}),
      safeReadJSON<RecentTrack[]>(RECENT_MIDIS_FILE, '@pbe_recent_midis', []),
      safeReadJSON<ActiveTrackState | null>(ACTIVE_TRACK_FILE, '@pbe_active_midi_track', null),
    ]);

    // Backwards compatibility migration for individual progress keys in localStorage on Web
    if (isWeb && Object.keys(progress).length === 0) {
      try {
        const migratedProgress: UserProgressData = {};
        const migratedNotes: UserNotesData = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith('@pbe_progress_')) {
            const hash = key.replace('@pbe_progress_', '');
            const val = localStorage.getItem(key);
            if (val) migratedProgress[hash] = JSON.parse(val);
          } else if (key?.startsWith('@pbe_notes_lvl_')) {
            const lvl = Number(key.replace('@pbe_notes_lvl_', ''));
            const val = localStorage.getItem(key);
            if (val && !isNaN(lvl)) {
              const hash = EXERCISE_HASHES[lvl] || String(lvl);
              migratedNotes[hash] = val;
            }
          }
        }
        if (Object.keys(migratedProgress).length > 0) {
          await safeWriteJSON(PROGRESS_FILE, '@pbe_progress', migratedProgress);
          Object.assign(progress, migratedProgress);
        }
        if (Object.keys(migratedNotes).length > 0) {
          await safeWriteJSON(NOTES_FILE, '@pbe_notes', migratedNotes);
          Object.assign(notes, migratedNotes);
        }
      } catch {}
    }

    let sanitizedTrack = activeTrack;
    if (activeTrack) {
      sanitizedTrack = {
        name: activeTrack.name,
        isPreset: !!activeTrack.isPreset,
        presetId: activeTrack.presetId,
      };
      if (JSON.stringify(activeTrack) !== JSON.stringify(sanitizedTrack)) {
        safeWriteJSON(ACTIVE_TRACK_FILE, '@pbe_active_midi_track', sanitizedTrack).catch(() => {});
      }
    }

    return { settings, progress, notes, recentMidis, activeTrack: sanitizedTrack };
  },

  async saveSettings(settings: AppSettings): Promise<void> {
    await safeWriteJSON(SETTINGS_FILE, '@pbe_settings', settings);
  },

  async saveProgress(progress: UserProgressData): Promise<void> {
    await safeWriteJSON(PROGRESS_FILE, '@pbe_progress', progress);
  },

  async saveUserNotes(notes: UserNotesData): Promise<void> {
    await safeWriteJSON(NOTES_FILE, '@pbe_notes', notes);
  },

  async saveRecentMidis(tracks: RecentTrack[]): Promise<void> {
    await safeWriteJSON(RECENT_MIDIS_FILE, '@pbe_recent_midis', tracks);
  },

  async saveActiveTrack(track: ActiveTrackState | null): Promise<void> {
    await safeWriteJSON(ACTIVE_TRACK_FILE, '@pbe_active_midi_track', track);
  },

  // Native Backup file generation
  async exportProgressBackup(): Promise<string | null> {
    try {
      const bundle = await this.loadAllData();
      const jsonStr = JSON.stringify(bundle, null, 2);
      if (isWeb) return jsonStr;
      
      const ext = Platform.OS === 'android' ? 'txt' : 'json';
      const tempPath = `${FileSystem.cacheDirectory}play_by_ear_backup.${ext}`;
      await FileSystem.writeAsStringAsync(tempPath, jsonStr);
      return tempPath;
    } catch (err) {
      console.error('[Storage] Backup compilation failed:', err);
      return null;
    }
  },

  async importProgressBackup(jsonStr: string): Promise<boolean> {
    try {
      const bundle: AppDataBundle = JSON.parse(jsonStr);
      if (!bundle.settings || !bundle.progress || !bundle.notes) {
        throw new Error('Invalid bundle layout');
      }

      await Promise.all([
        this.saveSettings(bundle.settings),
        this.saveProgress(bundle.progress),
        this.saveUserNotes(bundle.notes),
        this.saveRecentMidis(bundle.recentMidis || []),
        this.saveActiveTrack(bundle.activeTrack || null),
      ]);
      return true;
    } catch (err) {
      console.error('[Storage] Backup import failed:', err);
      return false;
    }
  }
};

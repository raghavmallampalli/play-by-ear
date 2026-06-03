import { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { AppDataBundle, ActiveTrackState, RecentTrack } from '../types/storage';
import { AppSettings } from '../types/settings';
import { EXERCISE_HASHES } from '../constants/exercises';

export function useAppData() {
  const [appData, setAppData] = useState<AppDataBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    StorageService.loadAllData().then((data) => {
      setAppData(data);
      setLoading(false);
    });
  }, [reloadKey]);

  const reloadData = () => {
    setReloadKey((prev) => prev + 1);
  };

  const handleSaveSettings = async (newSettings: AppSettings) => {
    setAppData((prev) => (prev ? { ...prev, settings: newSettings } : null));
    await StorageService.saveSettings(newSettings);
  };

  const handleSaveProgress = async (hash: string, rate: number) => {
    if (!appData) return;
    const existing = appData.progress[hash] || { timesTried: 0, averageSuccess: 0, bestSuccess: 0 };
    const tried = existing.timesTried + 1;
    const best = Math.max(existing.bestSuccess, rate);
    const average = Math.round((existing.averageSuccess * (tried - 1) + rate) / tried);

    const updatedProgress = {
      ...appData.progress,
      [hash]: { timesTried: tried, averageSuccess: average, bestSuccess: best },
    };

    setAppData((prev) => (prev ? { ...prev, progress: updatedProgress } : null));
    await StorageService.saveProgress(updatedProgress);
  };

  const handleSaveNotes = async (level: number, notes: string) => {
    if (!appData) return;
    const hash = EXERCISE_HASHES[level] || String(level);
    const updatedNotes = { ...appData.notes, [hash]: notes };
    setAppData((prev) => (prev ? { ...prev, notes: updatedNotes } : null));
    await StorageService.saveUserNotes(updatedNotes);
  };

  const handleSaveRecentTracks = async (tracks: RecentTrack[]) => {
    if (!appData) return;
    setAppData((prev) => (prev ? { ...prev, recentMidis: tracks } : null));
    await StorageService.saveRecentMidis(tracks);
  };

  const handleSaveActiveTrack = async (track: ActiveTrackState | null) => {
    if (!appData) return;
    setAppData((prev) => (prev ? { ...prev, activeTrack: track } : null));
    await StorageService.saveActiveTrack(track);
  };

  return {
    appData,
    loading,
    reloadData,
    handleSaveSettings,
    handleSaveProgress,
    handleSaveNotes,
    handleSaveRecentTracks,
    handleSaveActiveTrack,
  };
}

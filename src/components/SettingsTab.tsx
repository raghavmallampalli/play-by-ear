'use dom';

import React, { useState } from 'react';
import { buildLevel } from '../levels';
import { domStyles } from './styles/domStyles';
import { AppSettings, LevelConfig } from '../types/settings';

interface SettingsTabProps {
  settings: AppSettings;
  saveSettings: (newSettings: AppSettings) => void;
  isFromTrainer?: boolean;
  level: number;
  mode: 'trainer' | 'sandbox' | 'progress' | 'settings';
  levelConfig: LevelConfig;
  setLevelConfig: React.Dispatch<React.SetStateAction<LevelConfig>>;
}

export default function SettingsTab({
  settings,
  saveSettings,
  isFromTrainer = false,
  level,
  mode,
  levelConfig,
  setLevelConfig,
}: SettingsTabProps) {
  const [copiedExport, setCopiedExport] = useState(false);
  const [importJson, setImportJson] = useState('');

  const exportProgress = () => {
    const data: Record<string, string> = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('@pbe_progress_') || key.startsWith('@pbe_notes_lvl_') || key === '@pbe_settings')) {
          const val = localStorage.getItem(key);
          if (val) data[key] = val;
        }
      }
    } catch { }
    return JSON.stringify(data, null, 2);
  };

  const importProgress = (jsonStr: string) => {
    try {
      const data = JSON.parse(jsonStr);
      Object.keys(data).forEach(key => {
        if (key.startsWith('@pbe_progress_') || key.startsWith('@pbe_notes_lvl_') || key === '@pbe_settings') {
          localStorage.setItem(key, data[key]);
        }
      });
      alert('Progress & settings imported successfully!');
      window.location.reload();
    } catch {
      alert('Failed to parse progress backup. Please make sure the JSON format is correct.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* BPM controls only if from trainer */}
      {isFromTrainer && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' }}>
          <h4 style={domStyles.settingTitle}>Trainer Tempo (BPM)</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              style={{ ...domStyles.secondaryBtn, width: '40px', height: '40px', padding: 0, minWidth: '40px' }}
              onClick={() => {
                const nextBpm = Math.max(40, levelConfig.bpm - 5);
                setLevelConfig(prev => ({ ...prev, bpm: nextBpm }));
                const nextMap = { ...settings.tempoMap, [level]: nextBpm };
                saveSettings({ ...settings, tempoMap: nextMap });
              }}
            >
              -
            </button>
            <span style={{ fontSize: '16px', fontWeight: '800', color: '#E2E2E6', minWidth: '70px', textAlign: 'center' }}>
              {levelConfig.bpm} BPM
            </span>
            <button
              style={{ ...domStyles.secondaryBtn, width: '40px', height: '40px', padding: 0, minWidth: '40px' }}
              onClick={() => {
                const nextBpm = Math.min(240, levelConfig.bpm + 5);
                setLevelConfig(prev => ({ ...prev, bpm: nextBpm }));
                const nextMap = { ...settings.tempoMap, [level]: nextBpm };
                saveSettings({ ...settings, tempoMap: nextMap });
              }}
            >
              +
            </button>
            <button
              style={{ ...domStyles.dashedBtn, height: '36px', minWidth: '80px', padding: '0 10px', fontSize: '11px', marginLeft: 'auto' }}
              onClick={() => {
                const defaultSetup = buildLevel(mode === 'settings' ? 'trainer' : mode, level);
                const defaultBpm = defaultSetup.bpm;
                setLevelConfig(prev => ({ ...prev, bpm: defaultBpm }));
                const nextMap = { ...settings.tempoMap };
                delete nextMap[level];
                saveSettings({ ...settings, tempoMap: nextMap });
              }}
            >
              Reset Default
            </button>
          </div>
          <input
            type="range"
            min="40"
            max="240"
            value={levelConfig.bpm}
            onChange={(e) => {
              const nextBpm = Number(e.target.value);
              setLevelConfig(prev => ({ ...prev, bpm: nextBpm }));
              const nextMap = { ...settings.tempoMap, [level]: nextBpm };
              saveSettings({ ...settings, tempoMap: nextMap });
            }}
            style={{
              width: '100%',
              accentColor: '#A8C7FA',
              cursor: 'pointer',
              margin: '8px 0',
            }}
          />
        </div>
      )}

      {/* Instrument Mode Selection */}
      <div>
        <h4 style={domStyles.settingTitle}>Instrument Mode</h4>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            style={{
              flex: 1,
              ...(settings.instrumentMode === 'piano' ? domStyles.activeTabBtn : domStyles.secondaryBtn),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
            onClick={() => saveSettings({ ...settings, instrumentMode: 'piano' })}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="18" rx="2" ry="2" />
              <line x1="6" y1="3" x2="6" y2="21" />
              <line x1="10" y1="3" x2="10" y2="21" />
              <line x1="14" y1="3" x2="14" y2="21" />
              <line x1="18" y1="3" x2="18" y2="21" />
            </svg>
            Piano
          </button>
          <button
            disabled
            style={{
              ...domStyles.disabledBtn,
              flex: 1,
              opacity: 0.4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
            Guitar
          </button>
        </div>
      </div>

      {/* Note Labels Systems Selection */}
      <div>
        <h4 style={domStyles.settingTitle}>Melody Note Labels</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
          <button
            style={settings.melodyLabelSystem === 'carnatic' ? domStyles.activeTabBtn : domStyles.secondaryBtn}
            onClick={() => saveSettings({ ...settings, melodyLabelSystem: 'carnatic' })}
          >
            Carnatic (Sa, Re...)
          </button>
          <button
            style={settings.melodyLabelSystem === 'solfege' ? domStyles.activeTabBtn : domStyles.secondaryBtn}
            onClick={() => saveSettings({ ...settings, melodyLabelSystem: 'solfege' })}
          >
            Solfege (Do, Re...)
          </button>
          <button
            style={settings.melodyLabelSystem === 'numerical' ? domStyles.activeTabBtn : domStyles.secondaryBtn}
            onClick={() => saveSettings({ ...settings, melodyLabelSystem: 'numerical' })}
          >
            Numbers (1, 2...)
          </button>
          <button
            style={settings.melodyLabelSystem === 'abc' ? domStyles.activeTabBtn : domStyles.secondaryBtn}
            onClick={() => saveSettings({ ...settings, melodyLabelSystem: 'abc' })}
          >
            Absolute (C, D...)
          </button>
        </div>
      </div>

      {/* Chord Labels Selection */}
      <div>
        <h4 style={domStyles.settingTitle}>Chord Labels</h4>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            style={{ flex: 1, ...(settings.chordLabelSystem === 'roman' ? domStyles.activeTabBtn : domStyles.secondaryBtn) }}
            onClick={() => saveSettings({ ...settings, chordLabelSystem: 'roman' })}
          >
            Roman (I, IV, V)
          </button>
          <button
            style={{ flex: 1, ...(settings.chordLabelSystem === 'abc' ? domStyles.activeTabBtn : domStyles.secondaryBtn) }}
            onClick={() => saveSettings({ ...settings, chordLabelSystem: 'abc' })}
          >
            Absolute (C, F, G)
          </button>
        </div>
      </div>

      {/* Piano Visualizer Toggle */}
      <div style={domStyles.settingRow}>
        <div>
          <h4 style={domStyles.toggleLabel}>Piano Visualizer</h4>
        </div>

        <div
          onClick={() => saveSettings({ ...settings, visualizerEnabled: !settings.visualizerEnabled })}
          style={{
            ...domStyles.toggleContainer,
            backgroundColor: settings.visualizerEnabled ? '#A8C7FA' : 'rgba(255, 255, 255, 0.12)',
            border: settings.visualizerEnabled ? 'none' : '1.5px solid rgba(255, 255, 255, 0.24)',
          }}
        >
          <div style={{
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            backgroundColor: settings.visualizerEnabled ? '#111318' : '#8A92A6',
            position: 'absolute',
            top: settings.visualizerEnabled ? '5px' : '3.5px',
            left: settings.visualizerEnabled ? '24px' : '3.5px',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }} />
        </div>
      </div>

      {/* Confirm Restart Toggle Switch */}
      <div style={domStyles.settingRow}>
        <div>
          <h4 style={domStyles.toggleLabel}>Confirm Level Restart</h4>
          <p style={domStyles.toggleSublabel}>Warn before clearing progress to restart</p>
        </div>

        <div
          onClick={() => saveSettings({ ...settings, confirmRestartLevel: !settings.confirmRestartLevel })}
          style={{
            ...domStyles.toggleContainer,
            backgroundColor: settings.confirmRestartLevel ? '#A8C7FA' : 'rgba(255, 255, 255, 0.12)',
            border: settings.confirmRestartLevel ? 'none' : '1.5px solid rgba(255, 255, 255, 0.24)',
          }}
        >
          <div style={{
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            backgroundColor: settings.confirmRestartLevel ? '#111318' : '#8A92A6',
            position: 'absolute',
            top: settings.confirmRestartLevel ? '5px' : '3.5px',
            left: settings.confirmRestartLevel ? '24px' : '3.5px',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }} />
        </div>
      </div>

      {/* Progress Export & Import Actions */}
      <div style={{ marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
        <h4 style={domStyles.settingTitle}>Progress & Backups</h4>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
          <button
            style={{ ...domStyles.primaryBtn, flex: 1, height: '40px' }}
            onClick={() => {
              const json = exportProgress();
              navigator.clipboard.writeText(json).then(() => {
                setCopiedExport(true);
                setTimeout(() => setCopiedExport(false), 2500);
              }).catch(() => {
                alert('Backup copied automatically! Here is the JSON:\n\n' + json);
              });
            }}
          >
            {copiedExport ? 'Copied to Clipboard!' : 'Export Progress JSON'}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <textarea
            placeholder="Paste exported Progress JSON string here to import & restore..."
            value={importJson}
            onChange={(e) => setImportJson(e.target.value)}
            style={{
              ...domStyles.theoryNotesTextarea,
              height: '70px',
              fontFamily: 'monospace',
              fontSize: '11px',
              borderColor: 'rgba(168, 199, 250, 0.15)',
            }}
          />
          <button
            disabled={!importJson.trim()}
            style={{
              ...(!importJson.trim() ? domStyles.disabledBtn : domStyles.primaryBtn),
              height: '40px',
            }}
            onClick={() => importProgress(importJson)}
          >
            Import & Restore Progress
          </button>
        </div>
      </div>
    </div>
  );
}

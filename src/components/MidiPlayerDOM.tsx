'use dom';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { buildLevel, EXERCISE_HASHES, getAnswerChoices, getPreloadMidi, isQueuedLevel, LevelSetup } from '../levels';
import { displayLabel } from '../levels/labels';
import { TimelineSlot } from '../types/levels';
import { PlayedNote, PlayedChord } from '../types/music';
import { NoteConverter } from '../utils/note_converter';
import DawTimeline from './DawTimeline';
import { IconKeyboard, IconMelody, IconRestart, IconTuningFork } from './icons/TrainerIcons';
import KeyboardVisualizer from './KeyboardVisualizer';
import { domStyles } from './styles/domStyles';
import TheoryTab from './TheoryTab';
import { MelodyLabelSystem, ChordLabelSystem } from '../types/labels';

interface AppSettings {
  instrumentMode: 'piano' | 'guitar';
  melodyLabelSystem: MelodyLabelSystem;
  chordLabelSystem: ChordLabelSystem;
  visualizerEnabled: boolean;
  tempoMap: Record<number, number>;
}

const DEFAULT_SETTINGS: AppSettings = {
  instrumentMode: 'piano',
  melodyLabelSystem: 'carnatic',
  chordLabelSystem: 'roman',
  visualizerEnabled: true,
  tempoMap: {},
};

interface MidiPlayerDOMProps {
  mode?: 'trainer' | 'sandbox' | 'progress' | 'settings';
  level?: number;
  onNextLevel?: () => void;
  activeTab?: 'practice' | 'theory' | 'settings';
  onTabChange?: (tab: 'practice' | 'theory' | 'settings') => void;
}

export default function MidiPlayerDOM({ mode = 'trainer', level = 1, onNextLevel, activeTab: propsActiveTab, onTabChange }: MidiPlayerDOMProps) {
  const [localActiveTab, setLocalActiveTab] = useState<'practice' | 'theory' | 'settings'>('practice');
  const activeTab = propsActiveTab ?? localActiveTab;
  const setActiveTab = onTabChange ?? setLocalActiveTab;
  const [isLandscape, setIsLandscape] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  const [importJson, setImportJson] = useState('');
  const [copiedExport, setCopiedExport] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsLandscape(window.innerWidth > window.innerHeight && window.innerWidth >= 600);
    };
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ─── Settings management ────────────────────────────────────────────────────

  useEffect(() => {
    try {
      const stored = localStorage.getItem('@pbe_settings');
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch {}
  }, []);

  const saveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem('@pbe_settings', JSON.stringify(newSettings));
    } catch {}
  };

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
    } catch {}
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

  // ─── Level State ───────────────────────────────────────────────────────────

  const [melodyNotes, setMelodyNotes] = useState<PlayedNote[]>([]);
  const [chords, setChords] = useState<PlayedChord[]>([]);
  const [timelineSlots, setTimelineSlots] = useState<TimelineSlot[]>([]);
  const [focusedSlotIndex, setFocusedSlotIndex] = useState<number | null>(null);
  const [userNotes, setUserNotes] = useState('');
  const [tonicScrollTrigger, setTonicScrollTrigger] = useState(0);
  
  // 10-in-a-row queue state
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [exerciseQueue, setExerciseQueue] = useState<LevelSetup[]>([]);

  // Store level configuration to derive the converter
  const [levelConfig, setLevelConfig] = useState({
    bpm: 120,
    tonic: 0,
    octave: 4,
    ticksPerBeat: 480
  });

  const converter = useMemo(() => {
    return new NoteConverter(levelConfig.tonic, levelConfig.octave, levelConfig.bpm, levelConfig.ticksPerBeat);
  }, [levelConfig]);

  // Tooltip
  const [tooltipText, setTooltipText] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const tooltipTimer = useRef<any>(null);
  const tooltipDismissTimer = useRef<any>(null);

  const preloadMidi = useMemo(() => getPreloadMidi(mode, level), [mode, level]);
  const audio = useAudioEngine({ mode, level, preloadMidi });

  // ─── Sync persisted custom tempo ──────────────────────────────────────────

  useEffect(() => {
    const customBpm = settings.tempoMap[level];
    if (customBpm !== undefined && customBpm !== levelConfig.bpm) {
      setLevelConfig(prev => ({ ...prev, bpm: customBpm }));
    }
  }, [settings.tempoMap, level]);

  // ─── Setup ─────────────────────────────────────────────────────────────────

  const setupExercise = (keepCadence = false) => {
    audio.stopPlayback();
    if (!keepCadence) audio.resetStartFlags();

    const isQueued = mode === 'trainer' && isQueuedLevel(level);
    const persistedBpm = settings.tempoMap[level];

    if (isQueued) {
      // Generate a queue of 10 random sets (each generated dynamically via buildLevel)
      const queue: LevelSetup[] = [];
      for (let i = 0; i < 10; i++) {
        queue.push(buildLevel(mode, level));
      }
      setExerciseQueue(queue);
      setCurrentExerciseIndex(0);

      const first = queue[0];
      setMelodyNotes(first.melody);
      setChords(first.chords);
      setTimelineSlots(first.slots);
      setFocusedSlotIndex(0);
      setLevelConfig({
        bpm: persistedBpm ?? first.bpm,
        tonic: first.tonicPitchClass,
        octave: first.baseOctave,
        ticksPerBeat: first.ticksPerBeat
      });
    } else {
      // Single song/fixed progression level
      const setup = buildLevel(mode, level);
      setExerciseQueue([setup]);
      setCurrentExerciseIndex(0);
      setMelodyNotes(setup.melody);
      setChords(setup.chords);
      setTimelineSlots(setup.slots);
      setFocusedSlotIndex(0);
      setLevelConfig({
        bpm: persistedBpm ?? setup.bpm,
        tonic: setup.tonicPitchClass,
        octave: setup.baseOctave,
        ticksPerBeat: setup.ticksPerBeat
      });
    }
  };

  useEffect(() => {
    setupExercise();
  }, [level, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Progress persistence ───────────────────────────────────────────────────

  const saveProgressStats = (correct: number, total: number) => {
    const hash = EXERCISE_HASHES[level];
    if (!hash) return;
    const rate = Math.round((correct / total) * 100);
    try {
      const key = `@pbe_progress_${hash}`;
      const existing = localStorage.getItem(key);
      let tried = 1, average = rate, best = rate;
      if (existing) {
        const d = JSON.parse(existing);
        tried = (d.timesTried || 0) + 1;
        best = Math.max(d.bestSuccess || 0, rate);
        average = Math.round(((d.averageSuccess || 0) * (tried - 1) + rate) / tried);
      }
      localStorage.setItem(key, JSON.stringify({ timesTried: tried, averageSuccess: average, bestSuccess: best }));
    } catch { /* offline */ }
  };

  // ─── Interaction ───────────────────────────────────────────────────────────

  const handleChoice = (choice: string) => {
    if (focusedSlotIndex === null) return;
    const slot = timelineSlots[focusedSlotIndex];
    if (slot.answer !== null) return; // Ignore choices if already answered
    
    audio.playChoiceAudio(choice, converter);

    const newSlots = [...timelineSlots];
    newSlots[focusedSlotIndex] = {
      ...slot,
      answer: choice,
      correct: choice === slot.label,
    };
    setTimelineSlots(newSlots);

    // Update the slots in the current exercise in our queue
    setExerciseQueue((prevQueue) => {
      const updated = [...prevQueue];
      if (updated[currentExerciseIndex]) {
        updated[currentExerciseIndex] = {
          ...updated[currentExerciseIndex],
          slots: newSlots,
        };
      }
      return updated;
    });

    if (focusedSlotIndex < timelineSlots.length - 1) {
      setFocusedSlotIndex(focusedSlotIndex + 1);
    }
  };

  const handleSlotClick = (index: number) => {
    setFocusedSlotIndex(index);
    const slot = timelineSlots[index];
    const slotTime = converter.ticksToSeconds(slot.beat);
    
    // Stop playback, seek to slot's timestamp, and play from there immediately (skipping cadence)
    audio.stopPlayback();
    audio.setPlayheadTime(slotTime);
    audio.startPlayback(melodyNotes, chords, converter, true);
  };

  const showTooltip = (text: string, e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top - 8;
    
    if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
    if (tooltipDismissTimer.current) clearTimeout(tooltipDismissTimer.current);
    
    tooltipTimer.current = setTimeout(() => {
      setTooltipText(text);
      setTooltipPos({ x, y });
      
      // Auto-dismiss after 3 seconds to prevent sticky tooltips on mobile/touch interfaces
      tooltipDismissTimer.current = setTimeout(() => {
        setTooltipText(null);
      }, 3000);
    }, 450);
  };

  const hideTooltip = () => {
    if (tooltipTimer.current) {
      clearTimeout(tooltipTimer.current);
      tooltipTimer.current = null;
    }
    if (tooltipDismissTimer.current) {
      clearTimeout(tooltipDismissTimer.current);
      tooltipDismissTimer.current = null;
    }
    setTooltipText(null);
  };

  // Dynamically compute the correct and wrong counts across the current exercise queue
  const { correctCount, wrongCount } = useMemo(() => {
    let correct = 0;
    let wrong = 0;
    exerciseQueue.forEach((ex) => {
      ex.slots.forEach((s) => {
        if (s.answer !== null) {
          if (s.correct) {
            correct++;
          } else {
            wrong++;
          }
        }
      });
    });
    return { correctCount: correct, wrongCount: wrong };
  }, [exerciseQueue]);

  const isCurrentExerciseComplete = useMemo(() => {
    return timelineSlots.length > 0 && timelineSlots.every(s => s.answer !== null);
  }, [timelineSlots]);

  const handleNextClick = () => {
    if (!isCurrentExerciseComplete) return;

    if (currentExerciseIndex < exerciseQueue.length - 1) {
      // Advance to the next queued exercise
      const nextIdx = currentExerciseIndex + 1;
      setCurrentExerciseIndex(nextIdx);
      const nextEx = exerciseQueue[nextIdx];
      setMelodyNotes(nextEx.melody);
      setChords(nextEx.chords);
      setTimelineSlots(nextEx.slots);
      setFocusedSlotIndex(0);
      
      // Stop running audio and immediately start the next queued exercise (skipping cadence)
      audio.stopPlayback();
      audio.startPlayback(nextEx.melody, nextEx.chords, converter, true);
    } else {
      // Completed the entire level/queue!
      // 1. Calculate and save progress stats to localStorage
      const totalSlots = exerciseQueue.reduce((acc, ex) => acc + ex.slots.length, 0);
      const answeredSlots = exerciseQueue.flatMap(ex => ex.slots).filter(s => s.answer !== null);
      const totalCorrect = answeredSlots.filter(s => s.correct).length;
      saveProgressStats(totalCorrect, totalSlots);

      // 2. Navigate to the next level
      if (onNextLevel) {
        onNextLevel();
      }
    }
  };

  const skipCadence = useMemo(() => {
    return isQueuedLevel(level) && currentExerciseIndex > 0;
  }, [level, currentExerciseIndex]);

  // Group choices in rows of up to 4
  const choiceChunks = useMemo(() => {
    const choices = getAnswerChoices(level);
    const chunks: string[][] = [];
    for (let i = 0; i < choices.length; i += 4) {
      chunks.push(choices.slice(i, i + 4));
    }
    return chunks;
  }, [level]);

  // Check if the gameplay is interactable (must be started/running in trainer mode)
  const isInteractable = mode !== 'trainer' || audio.hasStarted;

  const firstPlayedNoteMidi = useMemo(() => {
    if (melodyNotes.length > 0) {
      return converter.toMidi(melodyNotes[0].note);
    }
    return converter.toMidi({ degree: 0, offset: 0 });
  }, [melodyNotes, converter]);

  const baseOctaveMidi = useMemo(() => {
    return converter.toMidi({ degree: 0, offset: 0 });
  }, [converter]);

  // Tonic button
  const handleTonicClick = () => {
    setTonicScrollTrigger((prev) => prev + 1);
    audio.playGroundingCadence(converter);
  };

  // Start exercise handler
  const handleStartClick = () => {
    setTonicScrollTrigger((prev) => prev + 1);
    audio.startPlayback(melodyNotes, chords, converter, skipCadence);
  };

  // ─── Settings Rendering ─────────────────────────────────────────────────────

  const renderSettingsContent = (isFromTrainer = false) => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* BPM controls only if from trainer */}
        {isFromTrainer && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' }}>
            <h4 style={{ fontSize: '11px', fontWeight: '800', color: '#A8C7FA', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Trainer Tempo (BPM)</h4>
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
                  const defaultSetup = buildLevel(mode, level);
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
          <h4 style={{ fontSize: '11px', fontWeight: '800', color: '#A8C7FA', margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Instrument Mode</h4>
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
          <h4 style={{ fontSize: '11px', fontWeight: '800', color: '#A8C7FA', margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Melody Note Labels</h4>
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
          <h4 style={{ fontSize: '11px', fontWeight: '800', color: '#A8C7FA', margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Chord Labels</h4>
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

        {/* Visualizer Control Toggle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.01)', padding: '12px 14px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.04)' }}>
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#E2E2E6', margin: 0 }}>Piano Visualizer</h4>
          </div>
          
          {/* Custom Premium Android/iOS-style Toggle Switch */}
          <div 
            onClick={() => saveSettings({ ...settings, visualizerEnabled: !settings.visualizerEnabled })}
            style={{
              width: '44px',
              height: '24px',
              borderRadius: '12px',
              backgroundColor: settings.visualizerEnabled ? '#A8C7FA' : 'rgba(255, 255, 255, 0.12)',
              border: settings.visualizerEnabled ? 'none' : '1.5px solid rgba(255, 255, 255, 0.24)',
              position: 'relative',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease, border-color 0.2s ease',
              boxSizing: 'border-box',
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

        {/* Progress Export & Import Actions */}
        <div style={{ marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
          <h4 style={{ fontSize: '11px', fontWeight: '800', color: '#A8C7FA', margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Progress & Backups</h4>
          
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
  };

  // ─── Dynamic Tab Row Component Helper ──────────────────────────────────────────

  const renderTabButton = (tab: 'practice' | 'theory' | 'settings', icon: React.ReactNode, title: string) => {
    const isActive = activeTab === tab;
    return (
      <button
        style={{
          ...(isActive ? domStyles.activeTabBtn : domStyles.tabBtn),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '12px 16px',
          borderRadius: '16px',
          flex: 1,
          transition: 'all 0.2s ease-in-out',
          height: '48px',
        }}
        onClick={() => setActiveTab(tab)}
      >
        {icon}
        <span style={{ fontSize: '13px', fontWeight: '800', letterSpacing: '0.5px' }}>{title}</span>
      </button>
    );
  };

  // ─── Play Controls row helper ────────────────────────────────────────────────

  const renderPlayControlsRow = (landscapeMode: boolean = false) => {
    const startBtn = (
      <div
        onMouseEnter={(e) => showTooltip(audio.hasStarted ? 'Restart Level' : 'Start Exercise', e)}
        onMouseLeave={hideTooltip}
        style={{ flex: 1, display: 'flex' }}
      >
        <button
          style={{
            ...(audio.hasStarted ? domStyles.restartBtn : domStyles.primaryBtn),
            flex: 1,
            width: '100%',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: 0,
            minWidth: 'auto',
          }}
          onClick={audio.hasStarted ? () => setupExercise(false) : handleStartClick}
        >
          {audio.hasStarted ? (
            <IconRestart />
          ) : (
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <polygon points="6 4 20 12 6 20 6 4" />
            </svg>
          )}
        </button>
      </div>
    );

    const tonicBtn = (
      <div
        onMouseEnter={(e) => showTooltip('Tonic Reference', e)}
        onMouseLeave={hideTooltip}
        style={{ flex: 1, display: 'flex' }}
      >
        <button
          disabled={!isInteractable}
          style={{
            ...(!isInteractable ? domStyles.disabledBtn : domStyles.secondaryBtn),
            flex: 1,
            width: '100%',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 'auto',
            pointerEvents: !isInteractable ? 'none' : 'auto',
          }}
          onClick={handleTonicClick}
        >
          <IconTuningFork />
        </button>
      </div>
    );

    const chordsBtn = (
      <div
        onMouseEnter={(e) => showTooltip('Play Backing Chords', e)}
        onMouseLeave={hideTooltip}
        style={{ flex: 1, display: 'flex' }}
      >
        <button
          disabled={!isInteractable || chords.length === 0}
          style={{
            ...((!isInteractable || chords.length === 0) ? domStyles.disabledBtn : domStyles.secondaryBtn),
            flex: 1,
            width: '100%',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 'auto',
            pointerEvents: (!isInteractable || chords.length === 0) ? 'none' : 'auto',
          }}
          onClick={() => audio.playBackingChordsOnly(chords, converter)}
        >
          <IconKeyboard />
        </button>
      </div>
    );

    const melodyBtn = (
      <div
        onMouseEnter={(e) => showTooltip('Play Melody Guide', e)}
        onMouseLeave={hideTooltip}
        style={{ flex: 1, display: 'flex' }}
      >
        <button
          disabled={!isInteractable || melodyNotes.length === 0}
          style={{
            ...((!isInteractable || melodyNotes.length === 0) ? domStyles.disabledBtn : domStyles.secondaryBtn),
            flex: 1,
            width: '100%',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 'auto',
            pointerEvents: (!isInteractable || melodyNotes.length === 0) ? 'none' : 'auto',
          }}
          onClick={() => audio.playMelodyOnly(melodyNotes, converter)}
        >
          <IconMelody />
        </button>
      </div>
    );

    if (landscapeMode) {
      return (
        <div style={{ display: 'flex', gap: '8px', width: '100%', marginBottom: '4px' }}>
          {startBtn}
          {tonicBtn}
          {chordsBtn}
          {melodyBtn}
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginBottom: '4px' }}>
        <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
          {startBtn}
          {tonicBtn}
        </div>
        <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
          {chordsBtn}
          {melodyBtn}
        </div>
      </div>
    );
  };

  // ─── Answer Choices card helper ──────────────────────────────────────────────

  const renderChoicesCard = () => {
    if (mode !== 'trainer') {
      return (
        <div style={domStyles.card}>
          <p style={{ ...domStyles.metaLabel, color: '#A8C7FA' }}>Sandbox Freeplay Mode</p>
          <p style={{ fontSize: '11px', color: '#8A92A6', lineHeight: '16px', margin: 0 }}>
            Tap keycaps on the virtual piano visualizer or play MIDI notes to trigger live sound and trace their relative positions.
          </p>
        </div>
      );
    }

    return (
      <div style={domStyles.card}>
        <p style={domStyles.metaLabel}>Identify the {level >= 4 ? 'Chord' : 'Scale Degree'}:</p>
        
        <div style={domStyles.answerContainer}>
          {choiceChunks.map((chunk, rowIdx) => (
            <div key={rowIdx} style={domStyles.answerRow}>
              {chunk.map((choice) => {
                const isSolved = focusedSlotIndex !== null && timelineSlots[focusedSlotIndex]?.answer !== null;
                const isButtonDisabled = !isInteractable || isSolved || isCurrentExerciseComplete;

                return (
                  <button
                    key={choice}
                    disabled={isButtonDisabled}
                    style={{
                      ...(isButtonDisabled ? domStyles.disabledBtn : domStyles.primaryBtn),
                      flex: 1,
                      maxWidth: '64px',
                    }}
                    onClick={() => handleChoice(choice)}
                  >
                    {displayLabel(choice, settings.melodyLabelSystem, settings.chordLabelSystem, levelConfig.tonic)}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ─── Progress dashboard card helper ──────────────────────────────────────────

  const renderProgressCard = () => {
    if (mode !== 'trainer') return null;

    return (
      <div style={{
        ...domStyles.card,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 18px',
        backgroundColor: 'rgba(168, 199, 250, 0.02)',
        borderColor: isCurrentExerciseComplete ? 'rgba(168, 199, 250, 0.15)' : 'rgba(255,255,255,0.04)',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '11px', fontWeight: '800', color: '#A8C7FA' }}>
            SET PROGRESS
          </span>
          <span style={{ fontSize: '12px', color: '#8A92A6', marginTop: '2px', fontWeight: '700' }}>
            Exercise {currentExerciseIndex + 1} of 10
          </span>
        </div>
        
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#81C784' }}>{correctCount}</span>
              <svg viewBox="0 0 24 24" width="12" height="12" stroke="#81C784" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#E57373' }}>{wrongCount}</span>
              <svg viewBox="0 0 24 24" width="12" height="12" stroke="#E57373" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
          </div>

          {isCurrentExerciseComplete && (
            <button
              style={{
                ...domStyles.primaryBtn,
                height: '36px',
                padding: '0 14px',
                fontSize: '12px',
                minWidth: 'auto',
                borderRadius: '12px',
              }}
              onClick={handleNextClick}
            >
              {currentExerciseIndex < 9 ? 'Next Set' : 'Finish Level'}
            </button>
          )}
        </div>
      </div>
    );
  };

  // ─── Universal Settings Screen Filling Component ──────────────────────────────

  const renderSettingsView = () => {
    return (
      <div style={{
        width: '100%',
        maxWidth: '520px',
        margin: '0 auto',
        boxSizing: 'border-box' as const,
      }}>
        <div style={domStyles.card}>
          {renderSettingsContent(mode !== 'settings')}
        </div>
      </div>
    );
  };

  // ─── Settings Screen Direct Embed overrides ───────────────────────────────────

  if (mode === 'settings') {
    return (
      <div style={domStyles.body}>
        <div style={{ ...domStyles.wrapper, padding: '16px 0', overflowY: 'auto' }}>
          {renderSettingsView()}
        </div>
      </div>
    );
  }

  // ─── Standard Multi-Tab Presentation Layout ──────────────────────────────────

  return (
    <div style={domStyles.body}>
      <style dangerouslySetInnerHTML={{ __html: `
        .piano-scroll-frame::-webkit-scrollbar {
          height: 6px !important;
          width: 6px !important;
          display: block !important;
        }
        .piano-scroll-frame::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.03) !important;
          border-radius: 10px !important;
        }
        .piano-scroll-frame::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.16) !important;
          border-radius: 10px !important;
        }
        .piano-scroll-frame::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3) !important;
        }
        .piano-scroll-frame {
          -ms-overflow-style: auto !important;
          scrollbar-width: thin !important;
          scrollbar-color: rgba(255, 255, 255, 0.16) transparent !important;
        }
      `}} />
      
      {/* 
        Add bottom padding to protect space for the truly fixed bottom navigation bar (72px high) in portrait.
        This guarantees that no scrolled page contents are ever hidden behind it.
      */}
      <div style={{
        ...(isLandscape ? domStyles.wrapperLandscape : domStyles.wrapper),
        paddingBottom: isLandscape ? '8px' : '88px',
      }}>
        
        {/* Full-Screen Tabbed Presentation area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', gap: '12px', overflowY: 'auto', minHeight: 0 }}>
          
          {/* Tab A: Full-Page Practice */}
          {activeTab === 'practice' && (
            isLandscape ? (
              // Two-column side-by-side landscape layout, vertically centered
              <div style={{
                ...domStyles.landscapeLayoutGrid,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100%',
                flex: 1,
              }}>
                
                {/* Left Column: Timeline and Keyboard */}
                <div style={domStyles.leftColumn}>
                  {mode === 'trainer' && (
                    <DawTimeline
                      level={level}
                      timelineSlots={timelineSlots}
                      focusedSlotIndex={focusedSlotIndex}
                      playheadTime={audio.playheadTime}
                      isPlaying={audio.isPlaying}
                      hasStarted={audio.hasStarted}
                      converter={converter}
                      onSlotClick={handleSlotClick}
                      onPlayPause={audio.isPlaying ? audio.pausePlayback : () => audio.startPlayback(melodyNotes, chords, converter, skipCadence)}
                      melodyLabelSystem={settings.melodyLabelSystem}
                      chordLabelSystem={settings.chordLabelSystem}
                    />
                  )}

                  {settings.visualizerEnabled && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
                        <span style={{
                          fontSize: '10px', color: '#A8C7FA',
                          backgroundColor: 'rgba(168, 199, 250, 0.08)',
                          border: '1px solid rgba(168, 199, 250, 0.15)',
                          padding: '2px 8px', borderRadius: '8px', fontWeight: '700',
                          display: 'flex', alignItems: 'center', gap: '5px',
                        }}>
                          <svg viewBox="0 0 24 24" width="10" height="10" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="7 8 3 12 7 16" />
                            <polyline points="17 8 21 12 17 16" />
                            <line x1="3" y1="12" x2="21" y2="12" />
                          </svg>
                          8 octaves
                        </span>
                      </div>
                      <KeyboardVisualizer
                        activeNotes={audio.activeNotes}
                        onNoteClick={audio.triggerLiveNote}
                        firstNoteMidi={firstPlayedNoteMidi}
                        baseOctaveMidi={baseOctaveMidi}
                        tonicScrollTrigger={tonicScrollTrigger}
                      />
                    </>
                  )}
                </div>

                {/* Right Column: Controls, Answers & Progress card */}
                <div style={{ ...domStyles.rightColumn, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {renderPlayControlsRow(true)}
                  {renderChoicesCard()}
                  {renderProgressCard()}
                </div>

              </div>
            ) : (
              // Portrait layout elements rendered cleanly in fullscreen practice, vertically centered
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                width: '100%',
                flex: 1,
                justifyContent: 'center',
                minHeight: '100%',
                boxSizing: 'border-box',
              }}>
                {mode === 'trainer' && (
                  <DawTimeline
                    level={level}
                    timelineSlots={timelineSlots}
                    focusedSlotIndex={focusedSlotIndex}
                    playheadTime={audio.playheadTime}
                    isPlaying={audio.isPlaying}
                    hasStarted={audio.hasStarted}
                    converter={converter}
                    onSlotClick={handleSlotClick}
                    onPlayPause={audio.isPlaying ? audio.pausePlayback : () => audio.startPlayback(melodyNotes, chords, converter, skipCadence)}
                    melodyLabelSystem={settings.melodyLabelSystem}
                    chordLabelSystem={settings.chordLabelSystem}
                  />
                )}

                {settings.visualizerEnabled && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <span style={{
                        fontSize: '10px', color: '#A8C7FA',
                        backgroundColor: 'rgba(168, 199, 250, 0.08)',
                        border: '1px solid rgba(168, 199, 250, 0.15)',
                        padding: '2px 8px', borderRadius: '8px', fontWeight: '700',
                        display: 'flex', alignItems: 'center', gap: '5px',
                      }}>
                        <svg viewBox="0 0 24 24" width="10" height="10" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="7 8 3 12 7 16" />
                          <polyline points="17 8 21 12 17 16" />
                          <line x1="3" y1="12" x2="21" y2="12" />
                        </svg>
                        8 octaves
                      </span>
                    </div>
                    <KeyboardVisualizer
                      activeNotes={audio.activeNotes}
                      onNoteClick={audio.triggerLiveNote}
                      firstNoteMidi={firstPlayedNoteMidi}
                      baseOctaveMidi={baseOctaveMidi}
                      tonicScrollTrigger={tonicScrollTrigger}
                    />
                  </>
                )}

                {renderChoicesCard()}
                {renderProgressCard()}
                {renderPlayControlsRow(false)}
              </div>
            )
          )}

          {/* Tab B: Full-Page Theory */}
          {activeTab === 'theory' && (
            <TheoryTab 
              level={level} 
              userNotes={userNotes} 
              onSaveNotes={(val) => {
                setUserNotes(val);
                try {
                  localStorage.setItem(`@pbe_notes_lvl_${level}`, val);
                } catch { /* offline */ }
              }} 
            />
          )}

          {/* Tab C: Full-Page Settings */}
          {activeTab === 'settings' && renderSettingsView()}

        </div>

        {/* 
          Truly fixed Bottom Navigation Tab Bar:
          Styled with position: fixed, bottom: 0, left/right: 0 to guarantee it is ALWAYS visible,
          floating at the absolute bottom of the screen, completely independent of page scrolling.
        */}
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '72px',
          display: isLandscape ? 'none' : 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          backgroundColor: '#111318',
          zIndex: 9999,
          boxSizing: 'border-box',
        }}>
          {renderTabButton('practice', (
            <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          ), 'Practice')}
          
          {renderTabButton('theory', (
            <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          ), 'Theory')}
          
          {renderTabButton('settings', (
            <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          ), 'Settings')}
        </div>

      </div>

      {/* Tooltip Render */}
      {tooltipText && (
        <div style={{
          position: 'fixed', left: tooltipPos.x, top: tooltipPos.y,
          transform: 'translate(-50%, -100%)', backgroundColor: '#2A2D34',
          color: '#E2E2E6', fontSize: '12px', fontWeight: 500,
          padding: '5px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)',
          pointerEvents: 'none', zIndex: 99999, whiteSpace: 'nowrap',
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        }}>
          {tooltipText}
        </div>
      )}
    </div>
  );
}

'use dom';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Colors } from '../constants/theme';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { buildLevel, EXERCISE_HASHES, getAnswerChoices, getPreloadMidi, isQueuedLevel, LevelSetup } from '../levels';
import { displayLabel } from '../levels/labels';
import { ChordLabelSystem, MelodyLabelSystem } from '../types/labels';
import { TimelineSlot } from '../types/levels';
import { PlayedChord, PlayedNote } from '../types/music';
import { NoteConverter } from '../utils/note_converter';
import DawTimeline from './DawTimeline';
import { IconKeyboard, IconMelody, IconRestart, IconTuningFork, IconPlay, IconPause, IconCheck, IconClose, IconArrowRight, IconPiano, IconBookOpen, IconCog, IconAlert } from './icons/DOMIcons';
import KeyboardVisualizer from './KeyboardVisualizer';
import { domStyles } from './styles/domStyles';
import TheoryTab from './TheoryTab';
import SettingsTab from './SettingsTab';
import { AppSettings } from '../types/settings';

const DEFAULT_SETTINGS: AppSettings = {
  instrumentMode: 'piano',
  melodyLabelSystem: 'carnatic',
  chordLabelSystem: 'roman',
  visualizerEnabled: true,
  tempoMap: {},
  confirmRestartLevel: true,
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
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    setTheme(media.matches ? 'dark' : 'light');
    const listener = (e: MediaQueryListEvent) => setTheme(e.matches ? 'dark' : 'light');
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  const themeColors = Colors[theme];

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
        setSettings({
          ...DEFAULT_SETTINGS,
          ...JSON.parse(stored)
        });
      }
    } catch { }
  }, []);

  const saveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem('@pbe_settings', JSON.stringify(newSettings));
    } catch { }
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

  // Restart modal warning
  const [showRestartModal, setShowRestartModal] = useState(false);
  const [dontShowRestartWarningAgain, setDontShowRestartWarningAgain] = useState(false);

  const audioMode = mode === 'settings' ? 'trainer' : mode;
  const preloadMidi = useMemo(() => getPreloadMidi(audioMode, level), [audioMode, level]);
  const audio = useAudioEngine({ mode: audioMode, level, preloadMidi });

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
    const buildMode = mode === 'settings' ? 'trainer' : mode;

    if (isQueued) {
      // Generate a queue of 10 random sets (each generated dynamically via buildLevel)
      const queue: LevelSetup[] = [];
      for (let i = 0; i < 10; i++) {
        queue.push(buildLevel(buildMode, level));
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
      const setup = buildLevel(buildMode, level);
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

  const handleRestartClick = () => {
    if (settings.confirmRestartLevel !== false) {
      setShowRestartModal(true);
    } else {
      setupExercise(false);
    }
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
        style={domStyles.practiceControlBtnWrapper}
      >
        <button
          style={{
            ...(audio.hasStarted ? domStyles.restartBtn : domStyles.primaryBtn),
            ...domStyles.practiceControlBtn,
          }}
          onClick={audio.hasStarted ? handleRestartClick : handleStartClick}
        >
          {audio.hasStarted ? (
            <IconRestart />
          ) : (
            <IconPlay size={16} color="currentColor" />
          )}
        </button>
      </div>
    );

    const tonicBtn = (
      <div
        onMouseEnter={(e) => showTooltip('Tonic Reference', e)}
        onMouseLeave={hideTooltip}
        style={domStyles.practiceControlBtnWrapper}
      >
        <button
          disabled={!isInteractable}
          style={{
            ...(!isInteractable ? domStyles.disabledBtn : domStyles.secondaryBtn),
            ...domStyles.practiceControlBtn,
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
        style={domStyles.practiceControlBtnWrapper}
      >
        <button
          disabled={!isInteractable || chords.length === 0}
          style={{
            ...((!isInteractable || chords.length === 0) ? domStyles.disabledBtn : domStyles.secondaryBtn),
            ...domStyles.practiceControlBtn,
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
        style={domStyles.practiceControlBtnWrapper}
      >
        <button
          disabled={!isInteractable || melodyNotes.length === 0}
          style={{
            ...((!isInteractable || melodyNotes.length === 0) ? domStyles.disabledBtn : domStyles.secondaryBtn),
            ...domStyles.practiceControlBtn,
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
        <div style={domStyles.practiceControlRowLandscape}>
          {startBtn}
          {tonicBtn}
          {chordsBtn}
          {melodyBtn}
        </div>
      );
    }

    return (
      <div style={domStyles.practiceControlRowPortrait}>
        <div style={domStyles.practiceControlSubRow}>
          {startBtn}
          {tonicBtn}
        </div>
        <div style={domStyles.practiceControlSubRow}>
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
        ...domStyles.progressCard,
        borderColor: isCurrentExerciseComplete ? 'rgba(168, 199, 250, 0.15)' : 'rgba(255,255,255,0.04)',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '13px', color: '#E2E2E6', fontWeight: '800' }}>
            Exercise {currentExerciseIndex + 1} of 10
          </span>
        </div>

        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '13px', fontWeight: '800', color: themeColors.correct }}>{correctCount}</span>
              <IconCheck size={12} color={themeColors.correct} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '13px', fontWeight: '800', color: themeColors.wrong }}>{wrongCount}</span>
              <IconClose size={12} color={themeColors.wrong} />
            </div>
          </div>

          <div
            onMouseEnter={(e) => showTooltip(
              isCurrentExerciseComplete
                ? (currentExerciseIndex < 9 ? 'Next Set' : 'Finish Level')
                : 'Identify all slots to continue',
              e
            )}
            onMouseLeave={hideTooltip}
            style={{ display: 'flex' }}
          >
            <button
              disabled={!isCurrentExerciseComplete}
              style={{
                ...(isCurrentExerciseComplete ? domStyles.primaryBtn : domStyles.disabledBtn),
                height: '36px',
                width: '36px',
                padding: 0,
                minWidth: 'auto',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: !isCurrentExerciseComplete ? 'none' : 'auto',
              }}
              onClick={handleNextClick}
            >
              <IconArrowRight size={16} color="currentColor" />
            </button>
          </div>
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
          <SettingsTab
            settings={settings}
            saveSettings={saveSettings}
            isFromTrainer={mode !== 'settings'}
            level={level}
            mode={mode}
            levelConfig={levelConfig}
            setLevelConfig={setLevelConfig}
          />
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
      <style dangerouslySetInnerHTML={{
        __html: `
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
                    <KeyboardVisualizer
                      activeNotes={audio.activeNotes}
                      onNoteClick={audio.triggerLiveNote}
                      firstNoteMidi={firstPlayedNoteMidi}
                      baseOctaveMidi={baseOctaveMidi}
                      tonicScrollTrigger={tonicScrollTrigger}
                    />
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
                  <KeyboardVisualizer
                    activeNotes={audio.activeNotes}
                    onNoteClick={audio.triggerLiveNote}
                    firstNoteMidi={firstPlayedNoteMidi}
                    baseOctaveMidi={baseOctaveMidi}
                    tonicScrollTrigger={tonicScrollTrigger}
                  />
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
          {renderTabButton('practice', <IconPiano size={22} color="currentColor" />, 'Practice')}
          {renderTabButton('theory', <IconBookOpen size={22} color="currentColor" />, 'Theory')}
          {renderTabButton('settings', <IconCog size={22} color="currentColor" />, 'Settings')}
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

      {/* Restart Warning Modal */}
      {showRestartModal && (
        <div style={domStyles.modalOverlay}>
          <div style={domStyles.modalCard}>
            {/* Warning Icon */}
            <div style={domStyles.modalIconContainer}>
              <IconAlert size={28} color="currentColor" />
            </div>

            {/* Title & Desc */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#E2E2E6', margin: 0 }}>Restart Level?</h3>
              <p style={{ fontSize: '13px', color: '#9AA0A6', margin: 0, lineHeight: '1.5' }}>
                This will restart the level, not just the current set. Are you sure?
              </p>
            </div>

            {/* Don't show again row with tick */}
            <label style={domStyles.modalCheckboxRow}>
              <input
                type="checkbox"
                checked={dontShowRestartWarningAgain}
                onChange={(e) => setDontShowRestartWarningAgain(e.target.checked)}
                style={{
                  width: '16px',
                  height: '16px',
                  accentColor: '#A8C7FA',
                  cursor: 'pointer',
                }}
              />
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#C4C7C5' }}>
                Don't show this warning again
              </span>
            </label>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '4px' }}>
              <button
                style={{
                  ...domStyles.secondaryBtn,
                  flex: 1,
                  height: '42px',
                  borderRadius: '14px',
                  fontSize: '13px',
                  fontWeight: '800',
                }}
                onClick={() => {
                  setShowRestartModal(false);
                  setDontShowRestartWarningAgain(false);
                }}
              >
                Cancel
              </button>
              <button
                style={{
                  ...domStyles.restartBtn,
                  flex: 1,
                  height: '42px',
                  borderRadius: '14px',
                  fontSize: '13px',
                  fontWeight: '800',
                  border: 'none',
                  backgroundColor: '#E9A117',
                  color: '#0A0B0E',
                }}
                onClick={() => {
                  if (dontShowRestartWarningAgain) {
                    saveSettings({
                      ...settings,
                      confirmRestartLevel: false,
                    });
                  }
                  setShowRestartModal(false);
                  setDontShowRestartWarningAgain(false);
                  setupExercise(false);
                }}
              >
                Restart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

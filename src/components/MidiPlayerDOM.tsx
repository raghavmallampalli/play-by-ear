'use dom';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { buildLevel, EXERCISE_HASHES, getAnswerChoices, getPreloadMidi, isQueuedLevel, LevelSetup } from '../levels';
import { TimelineSlot } from '../types/levels';
import { PlayedNote, PlayedChord } from '../types/music';
import { NoteConverter } from '../utils/note_converter';
import DawTimeline from './DawTimeline';
import { IconKeyboard, IconMelody, IconRestart, IconTuningFork } from './icons/TrainerIcons';
import KeyboardVisualizer from './KeyboardVisualizer';
import { domStyles } from './styles/domStyles';
import TheoryTab from './TheoryTab';

interface MidiPlayerDOMProps {
  mode?: 'trainer' | 'sandbox' | 'progress';
  level?: number;
  onNextLevel?: () => void;
}

export default function MidiPlayerDOM({ mode = 'trainer', level = 1, onNextLevel }: MidiPlayerDOMProps) {
  const [activeTab, setActiveTab] = useState<'practice' | 'theory'>('practice');
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsLandscape(window.innerWidth > window.innerHeight && window.innerWidth >= 600);
    };
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const preloadMidi = useMemo(() => getPreloadMidi(mode, level), [mode, level]);
  const audio = useAudioEngine({ mode, level, preloadMidi });

  // ─── Setup ─────────────────────────────────────────────────────────────────

  const setupExercise = (keepCadence = false) => {
    audio.stopPlayback();
    if (!keepCadence) audio.resetStartFlags();

    const isQueued = mode === 'trainer' && isQueuedLevel(level);

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
        bpm: first.bpm,
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
        bpm: setup.bpm,
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
    tooltipTimer.current = setTimeout(() => {
      setTooltipText(text);
      setTooltipPos({ x, y });
    }, 450);
  };

  const hideTooltip = () => {
    if (tooltipTimer.current) {
      clearTimeout(tooltipTimer.current);
      tooltipTimer.current = null;
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
      
      // Stop and reset audio
      audio.stopPlayback();
      audio.resetStartFlags();
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
      <div style={isLandscape ? domStyles.wrapperLandscape : domStyles.wrapper}>
        
        {isLandscape ? (
          // Two-column side-by-side landscape layout
          <div style={domStyles.landscapeLayoutGrid}>
            
            {/* Left Column: Timeline and Keyboard */}
            <div style={domStyles.leftColumn}>
              {/* DAW timeline card */}
              {mode === 'trainer' && (
                <div style={domStyles.card}>
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
                  />
                </div>
              )}

              {/* Scrollable Piano Visualizer with Indicator */}
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
            </div>

            {/* Right Column: Navigation Tabs & Tab Content */}
            <div style={domStyles.rightColumn}>
              {/* Practice & Theory Navigation Tabs */}
              <div style={domStyles.tabRow}>
                <button
                  style={activeTab === 'practice' ? domStyles.activeTabBtn : domStyles.tabBtn}
                  onClick={() => setActiveTab('practice')}
                >
                  Practice Exercise
                </button>
                <button
                  style={activeTab === 'theory' ? domStyles.activeTabBtn : domStyles.tabBtn}
                  onClick={() => setActiveTab('theory')}
                >
                  Theory & Notes
                </button>
              </div>

              {activeTab === 'practice' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                  {/* Core Controls: Top Row (Tonic, Chords, Melody) */}
                  <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                    <button
                      disabled={!isInteractable}
                      style={{
                        ...(!isInteractable ? domStyles.disabledBtn : domStyles.secondaryBtn),
                        flex: 1,
                      }}
                      onClick={handleTonicClick}
                      onMouseEnter={(e) => isInteractable && showTooltip('Tonic Reference', e)}
                      onMouseLeave={hideTooltip}
                    >
                      <IconTuningFork />
                    </button>
                    <button
                      disabled={!isInteractable || chords.length === 0}
                      style={{
                        ...((!isInteractable || chords.length === 0) ? domStyles.disabledBtn : domStyles.secondaryBtn),
                        flex: 1,
                      }}
                      onClick={() => audio.playBackingChordsOnly(chords, converter)}
                      onMouseEnter={(e) => isInteractable && chords.length > 0 && showTooltip('Root Chords Backing', e)}
                      onMouseLeave={hideTooltip}
                    >
                      <IconKeyboard />
                    </button>
                    <button
                      disabled={!isInteractable || melodyNotes.length === 0}
                      style={{
                        ...((!isInteractable || melodyNotes.length === 0) ? domStyles.disabledBtn : domStyles.secondaryBtn),
                        flex: 1,
                      }}
                      onClick={() => audio.playMelodyOnly(melodyNotes, converter)}
                      onMouseEnter={(e) => isInteractable && melodyNotes.length > 0 && showTooltip('Just Melody Guide', e)}
                      onMouseLeave={hideTooltip}
                    >
                      <IconMelody />
                    </button>
                  </div>

                  {/* Answer Selector Controls & Restart */}
                  {mode === 'trainer' && (
                    <div style={domStyles.card}>
                      <div style={domStyles.answerContainer}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '4px' }}>
                          <p style={domStyles.metaLabel}>Identify the {level >= 4 ? 'Chord' : 'Scale Degree'}:</p>
                          {isQueuedLevel(level) && (
                            <span style={{
                              fontSize: '10px',
                              color: '#A8C7FA',
                              backgroundColor: 'rgba(168, 199, 250, 0.08)',
                              padding: '2px 8px',
                              borderRadius: '8px',
                              fontWeight: '700',
                            }}>
                              Exercise {currentExerciseIndex + 1} of 10
                            </span>
                          )}
                        </div>

                        {/* Choices rows (max 4 per row) */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginBottom: '8px' }}>
                          {choiceChunks.map((chunk, chunkIdx) => (
                            <div key={chunkIdx} style={{ display: 'flex', flexDirection: 'row', gap: '12px', justifyContent: 'center', width: '100%' }}>
                              {chunk.map((choice) => {
                                const isAnswered = focusedSlotIndex !== null && timelineSlots[focusedSlotIndex]?.answer !== null;
                                return (
                                  <button
                                    key={choice}
                                    disabled={isAnswered}
                                    style={{
                                      ...(isAnswered ? domStyles.disabledBtn : domStyles.primaryBtn),
                                      flex: 1,
                                      maxWidth: '64px',
                                    }}
                                    onClick={() => handleChoice(choice)}
                                  >
                                    {choice}
                                  </button>
                                );
                              })}
                            </div>
                          ))}
                        </div>

                        {/* Last row: Start/Reset (1/3 width), Accuracy (1/3 width), Next (1/3 width) */}
                        <div style={{
                          display: 'flex',
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%',
                          gap: '12px',
                          marginTop: '8px',
                          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                          paddingTop: '16px',
                        }}>
                          {/* Column 1: Start/Reset Button (2/5 of the row) */}
                          <div style={{ flex: 2, display: 'flex' }}>
                            <button
                              style={{
                                ...(audio.hasStarted ? domStyles.secondaryBtn : domStyles.primaryBtn),
                                width: '100%',
                              }}
                              onClick={audio.hasStarted ? () => setupExercise(false) : handleStartClick}
                            >
                              {audio.hasStarted ? (
                                <>
                                  <IconRestart /> Restart
                                </>
                              ) : (
                                <>
                                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style={{ marginRight: '6px' }}>
                                    <polygon points="6 4 20 12 6 20 6 4"></polygon>
                                  </svg>
                                  {skipCadence ? 'Continue' : 'Start'}
                                </>
                              )}
                            </button>
                          </div>

                          {/* Column 2: Accuracy Counts (1/5 of the row) */}
                          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ fontSize: '13px', fontWeight: '800', color: '#81C784' }}>{correctCount}</span>
                                <svg viewBox="0 0 24 24" width="14" height="14" stroke="#81C784" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ fontSize: '13px', fontWeight: '800', color: '#E57373' }}>{wrongCount}</span>
                                <svg viewBox="0 0 24 24" width="14" height="14" stroke="#E57373" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="18" y1="6" x2="6" y2="18" />
                                  <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                              </div>
                            </div>
                          </div>

                          {/* Column 3: Next Button (2/5 of the row) */}
                          <div style={{ flex: 2, display: 'flex' }}>
                            <button
                              disabled={!isCurrentExerciseComplete}
                              style={{
                                ...(isCurrentExerciseComplete ? domStyles.primaryBtn : domStyles.disabledBtn),
                                width: '100%',
                              }}
                              onClick={handleNextClick}
                            >
                              <span>Next</span>
                              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px' }}>
                                <line x1="5" y1="12" x2="19" y2="12" />
                                <polyline points="12 5 19 12 12 19" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
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
            </div>

          </div>
        ) : (
          // Standard one-column vertical layout (Portrait)
          <>
            {/* Practice & Theory Navigation Tabs */}
            <div style={domStyles.tabRow}>
              <button
                style={activeTab === 'practice' ? domStyles.activeTabBtn : domStyles.tabBtn}
                onClick={() => setActiveTab('practice')}
              >
                Practice Exercise
              </button>
              <button
                style={activeTab === 'theory' ? domStyles.activeTabBtn : domStyles.tabBtn}
                onClick={() => setActiveTab('theory')}
              >
                Theory & Notes
              </button>
            </div>

            {activeTab === 'practice' ? (
              <>
                {/* Core Controls: Top Row (Tonic, Chords, Melody) */}
                <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                  <button
                    disabled={!isInteractable}
                    style={{
                      ...(!isInteractable ? domStyles.disabledBtn : domStyles.secondaryBtn),
                      flex: 1,
                    }}
                    onClick={handleTonicClick}
                    onMouseEnter={(e) => isInteractable && showTooltip('Tonic Reference', e)}
                    onMouseLeave={hideTooltip}
                  >
                    <IconTuningFork />
                  </button>
                  <button
                    disabled={!isInteractable || chords.length === 0}
                    style={{
                      ...((!isInteractable || chords.length === 0) ? domStyles.disabledBtn : domStyles.secondaryBtn),
                      flex: 1,
                    }}
                    onClick={() => audio.playBackingChordsOnly(chords, converter)}
                    onMouseEnter={(e) => isInteractable && chords.length > 0 && showTooltip('Root Chords Backing', e)}
                    onMouseLeave={hideTooltip}
                  >
                    <IconKeyboard />
                  </button>
                  <button
                    disabled={!isInteractable || melodyNotes.length === 0}
                    style={{
                      ...((!isInteractable || melodyNotes.length === 0) ? domStyles.disabledBtn : domStyles.secondaryBtn),
                      flex: 1,
                    }}
                    onClick={() => audio.playMelodyOnly(melodyNotes, converter)}
                    onMouseEnter={(e) => isInteractable && melodyNotes.length > 0 && showTooltip('Just Melody Guide', e)}
                    onMouseLeave={hideTooltip}
                  >
                    <IconMelody />
                  </button>
                </div>

                {/* DAW timeline card */}
                {mode === 'trainer' && (
                  <div style={domStyles.card}>
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
                    />
                  </div>
                )}

                {/* Scrollable Piano Visualizer with Indicator */}
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

                {/* Answer Selector Controls & Restart */}
                {mode === 'trainer' && (
                  <div style={domStyles.card}>
                    <div style={domStyles.answerContainer}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '4px' }}>
                        <p style={domStyles.metaLabel}>Identify the {level >= 4 ? 'Chord' : 'Scale Degree'}:</p>
                        {isQueuedLevel(level) && (
                          <span style={{
                            fontSize: '10px',
                            color: '#A8C7FA',
                            backgroundColor: 'rgba(168, 199, 250, 0.08)',
                            padding: '2px 8px',
                            borderRadius: '8px',
                            fontWeight: '700',
                          }}>
                            Exercise {currentExerciseIndex + 1} of 10
                          </span>
                        )}
                      </div>

                      {/* Choices rows (max 4 per row) */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginBottom: '8px' }}>
                        {choiceChunks.map((chunk, chunkIdx) => (
                          <div key={chunkIdx} style={{ display: 'flex', flexDirection: 'row', gap: '12px', justifyContent: 'center', width: '100%' }}>
                            {chunk.map((choice) => {
                              const isAnswered = focusedSlotIndex !== null && timelineSlots[focusedSlotIndex]?.answer !== null;
                              return (
                                <button
                                  key={choice}
                                  disabled={isAnswered}
                                  style={{
                                    ...(isAnswered ? domStyles.disabledBtn : domStyles.primaryBtn),
                                    flex: 1,
                                    maxWidth: '64px',
                                  }}
                                  onClick={() => handleChoice(choice)}
                                >
                                  {choice}
                                </button>
                              );
                            })}
                          </div>
                        ))}
                      </div>

                      {/* Last row: Start/Reset (1/3 width), Accuracy (1/3 width), Next (1/3 width) */}
                      <div style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        gap: '12px',
                        marginTop: '8px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                        paddingTop: '16px',
                      }}>
                        {/* Column 1: Start/Reset Button (2/5 of the row) */}
                        <div style={{ flex: 2, display: 'flex' }}>
                          <button
                            style={{
                              ...(audio.hasStarted ? domStyles.secondaryBtn : domStyles.primaryBtn),
                              width: '100%',
                            }}
                            onClick={audio.hasStarted ? () => setupExercise(false) : handleStartClick}
                          >
                            {audio.hasStarted ? (
                              <>
                                <IconRestart /> Restart
                              </>
                            ) : (
                              <>
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style={{ marginRight: '6px' }}>
                                  <polygon points="6 4 20 12 6 20 6 4"></polygon>
                                </svg>
                                {skipCadence ? 'Continue' : 'Start'}
                              </>
                            )}
                          </button>
                        </div>

                        {/* Column 2: Accuracy Counts (1/5 of the row) */}
                        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ fontSize: '13px', fontWeight: '800', color: '#81C784' }}>{correctCount}</span>
                              <svg viewBox="0 0 24 24" width="14" height="14" stroke="#81C784" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ fontSize: '13px', fontWeight: '800', color: '#E57373' }}>{wrongCount}</span>
                              <svg viewBox="0 0 24 24" width="14" height="14" stroke="#E57373" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            </div>
                          </div>
                        </div>

                        {/* Column 3: Next Button (2/5 of the row) */}
                        <div style={{ flex: 2, display: 'flex' }}>
                          <button
                            disabled={!isCurrentExerciseComplete}
                            style={{
                              ...(isCurrentExerciseComplete ? domStyles.primaryBtn : domStyles.disabledBtn),
                              width: '100%',
                            }}
                            onClick={handleNextClick}
                          >
                            <span>Next</span>
                            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px' }}>
                              <line x1="5" y1="12" x2="19" y2="12" />
                              <polyline points="12 5 19 12 12 19" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
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
          </>
        )}
      </div>

      {/* Tooltip Render */}
      {tooltipText && (
        <div style={{
          position: 'fixed', left: tooltipPos.x, top: tooltipPos.y,
          transform: 'translate(-50%, -100%)', backgroundColor: '#2A2D34',
          color: '#E2E2E6', fontSize: '12px', fontWeight: 500,
          padding: '5px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)',
          pointerEvents: 'none', zIndex: 9999, whiteSpace: 'nowrap',
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        }}>
          {tooltipText}
        </div>
      )}
    </div>
  );
}

'use dom';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { buildLevel, EXERCISE_HASHES, getAnswerChoices, getPreloadMidi } from '../levels';
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
}

export default function MidiPlayerDOM({ mode = 'trainer', level = 1 }: MidiPlayerDOMProps) {
  const [activeTab, setActiveTab] = useState<'practice' | 'theory'>('practice');
  const [melodyNotes, setMelodyNotes] = useState<PlayedNote[]>([]);
  const [chords, setChords] = useState<PlayedChord[]>([]);
  const [timelineSlots, setTimelineSlots] = useState<TimelineSlot[]>([]);
  const [focusedSlotIndex, setFocusedSlotIndex] = useState<number | null>(null);
  const [userNotes, setUserNotes] = useState('');
  
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
    setFocusedSlotIndex(0);

    const setup = buildLevel(mode, level);
    setMelodyNotes(setup.melody);
    setChords(setup.chords);
    setTimelineSlots(setup.slots);
    setLevelConfig({
      bpm: setup.bpm,
      tonic: setup.tonicPitchClass,
      octave: setup.baseOctave,
      ticksPerBeat: setup.ticksPerBeat
    });
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
    
    audio.playChoiceAudio(choice, converter);

    const newSlots = [...timelineSlots];
    newSlots[focusedSlotIndex] = {
      ...slot,
      answer: choice,
      correct: choice === slot.label,
    };
    setTimelineSlots(newSlots);

    if (focusedSlotIndex < timelineSlots.length - 1) {
      setFocusedSlotIndex(focusedSlotIndex + 1);
    } else {
      const correctCount = newSlots.filter(s => s.correct).length;
      saveProgressStats(correctCount, newSlots.length);
    }
  };

  const handleSlotClick = (index: number) => {
    setFocusedSlotIndex(index);
    const slot = timelineSlots[index];
    const isRevealed = slot.answer !== null && slot.correct;
    if (slot.chord) {
      audio.playChoiceAudio(slot.chord, converter, isRevealed);
    } else {
      audio.triggerLiveNote(converter.toMidi(slot.note), isRevealed);
    }
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

  // Tonic button
  const handleTonicClick = () => {
    audio.playGroundingCadence(converter);
  };

  return (
    <div style={domStyles.body}>
      <div style={domStyles.wrapper}>
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
                style={{ ...domStyles.gridBtn, flex: 1, padding: '12px 0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                onClick={handleTonicClick}
                onMouseEnter={(e) => showTooltip('Tonic Reference', e)}
                onMouseLeave={hideTooltip}
              >
                <IconTuningFork />
              </button>
              <button
                style={{
                  ...domStyles.gridBtn,
                  flex: 1,
                  padding: '12px 0',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  opacity: chords.length === 0 ? 0.4 : 1,
                  cursor: chords.length === 0 ? 'not-allowed' : 'pointer',
                }}
                onClick={() => audio.playBackingChordsOnly(chords, converter)}
                disabled={chords.length === 0}
                onMouseEnter={(e) => chords.length > 0 && showTooltip('Root Chords Backing', e)}
                onMouseLeave={hideTooltip}
              >
                <IconKeyboard />
              </button>
              <button
                style={{
                  ...domStyles.gridBtn,
                  flex: 1,
                  padding: '12px 0',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  opacity: melodyNotes.length === 0 ? 0.4 : 1,
                  cursor: melodyNotes.length === 0 ? 'not-allowed' : 'pointer',
                }}
                onClick={() => audio.playMelodyOnly(melodyNotes, converter)}
                disabled={melodyNotes.length === 0}
                onMouseEnter={(e) => melodyNotes.length > 0 && showTooltip('Just Melody Guide', e)}
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
                  onPlayPause={audio.isPlaying ? audio.pausePlayback : () => audio.startPlayback(melodyNotes, chords, converter)}
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
            <KeyboardVisualizer activeNotes={audio.activeNotes} onNoteClick={audio.triggerLiveNote} />

            {/* Answer Selector Controls & Restart */}
            {mode === 'trainer' && (
              <div style={domStyles.card}>
                <div style={domStyles.answerContainer}>
                  <p style={domStyles.metaLabel}>Identify the {level >= 4 ? 'Chord' : 'Scale Degree'}:</p>
                  <div style={domStyles.answerRow}>
                    {getAnswerChoices(level).map((choice) => (
                      <button
                        key={choice}
                        style={domStyles.answerBtn}
                        onClick={() => handleChoice(choice)}
                      >
                        {choice}
                      </button>
                    ))}
                    <button
                      style={{
                        ...domStyles.restartBtn,
                        backgroundColor: audio.hasStarted ? '#25282F' : '#A8C7FA',
                        color: audio.hasStarted ? '#E2E2E6' : '#0A305F',
                        border: audio.hasStarted ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                        boxShadow: audio.hasStarted ? 'none' : '0 2px 6px rgba(168, 199, 250, 0.25)',
                      }}
                      onClick={audio.hasStarted ? () => setupExercise(true) : () => audio.startPlayback(melodyNotes, chords, converter)}
                    >
                      {audio.hasStarted ? (
                        <>
                          <IconRestart /> Reset
                        </>
                      ) : (
                        <>
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style={{ marginRight: '6px' }}>
                            <polygon points="6 4 20 12 6 20 6 4"></polygon>
                          </svg>
                          Start
                        </>
                      )}
                    </button>
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

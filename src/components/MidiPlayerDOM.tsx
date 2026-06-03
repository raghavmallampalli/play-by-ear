'use dom';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MIDI_PRESETS } from '../constants/midi_presets';
import { Colors } from '../constants/theme';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { buildLevel, EXERCISE_HASHES, getAnswerChoices, getPreloadMidi, isQueuedLevel, LevelSetup } from '../levels';
import { displayLabel, DEFAULT_MELODY_LABELS, DEFAULT_CHORD_LABELS } from '../levels/labels';
import { TimelineSlot } from '../types/levels';
import { PlayedChord, PlayedNote, RelativeNote } from '../types/music';
import { AppSettings } from '../types/settings';
import { UserProgressData, UserNotesData, RecentTrack, ActiveTrackState } from '../types/storage';
import { NoteConverter } from '../utils/note_converter';
import DawTimeline from './DawTimeline';
import { log } from '../utils/logger';
import { IconAlert, IconArrowRight, IconBookOpen, IconCheck, IconClose, IconCog, IconFastForward, IconFolder, IconHistory, IconKeyboard, IconMelody, IconMusic, IconPiano, IconPlay, IconRestart, IconTuningFork, IconUpload } from './icons/DOMIcons';
import KeyboardVisualizer from './KeyboardVisualizer';
import SettingsTab from './SettingsTab';
import { domStyles } from './styles/domStyles';
import TheoryTab from './TheoryTab';

const DEFAULT_SETTINGS: AppSettings = {
  instrumentMode: 'piano',
  melodyLabelSystem: DEFAULT_MELODY_LABELS,
  chordLabelSystem: DEFAULT_CHORD_LABELS,
  visualizerEnabled: true,
  tempoMap: {},
  midiTempoMap: {},
  confirmRestartLevel: true,
};

interface MidiPlayerDOMProps {
  mode?: 'trainer' | 'progress' | 'settings' | 'midi_player';
  level?: number;
  onNextLevel?: () => void;
  activeTab?: 'practice' | 'theory' | 'settings' | 'loader';
  onTabChange?: (tab: 'practice' | 'theory' | 'settings' | 'loader') => void;
  presetId?: string;
  action?: 'play' | 'pause';

  settingsProp?: AppSettings;
  progressProp?: UserProgressData;
  notesProp?: UserNotesData;
  recentTracksProp?: RecentTrack[];
  activeTrackProp?: ActiveTrackState | null;

  onSaveSettings?: (settings: AppSettings) => void;
  onSaveProgress?: (hash: string, scoreRate: number) => void;
  onSaveUserNotes?: (level: number, text: string) => void;
  onSaveRecentTracks?: (tracks: RecentTrack[]) => void;
  onSaveActiveTrack?: (track: ActiveTrackState | null) => void;

  onExportProgress?: () => void;
  onImportProgress?: () => void;
  onLoadCustomMidi?: (onMidiLoaded: (name: string, base64: string) => void) => void;
}

export default function MidiPlayerDOM({ 
  mode = 'trainer', 
  level = 1, 
  onNextLevel, 
  activeTab: propsActiveTab, 
  onTabChange, 
  presetId, 
  action,
  settingsProp,
  progressProp,
  notesProp,
  recentTracksProp,
  activeTrackProp,
  onSaveSettings,
  onSaveProgress,
  onSaveUserNotes,
  onSaveRecentTracks,
  onSaveActiveTrack,
  onExportProgress,
  onImportProgress,
  onLoadCustomMidi
}: MidiPlayerDOMProps) {
  const [localActiveTab, setLocalActiveTab] = useState<'practice' | 'theory' | 'settings' | 'loader'>(mode === 'midi_player' ? 'loader' : 'practice');
  const activeTab = propsActiveTab ?? localActiveTab;
  const setActiveTab = onTabChange ?? setLocalActiveTab;
  const [isLandscape, setIsLandscape] = useState(false);
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

  const [settings, setSettings] = useState<AppSettings>(settingsProp ?? DEFAULT_SETTINGS);

  useEffect(() => {
    if (settingsProp) {
      setSettings(settingsProp);
    }
  }, [settingsProp]);

  const saveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    onSaveSettings?.(newSettings);
  };

  // ─── Level State ───────────────────────────────────────────────────────────

  const [melodyNotes, setMelodyNotes] = useState<PlayedNote[]>([]);
  const [chords, setChords] = useState<PlayedChord[]>([]);
  const [timelineSlots, setTimelineSlots] = useState<TimelineSlot[]>([]);
  const [focusedSlotIndex, setFocusedSlotIndex] = useState<number | null>(null);
  const [userNotes, setUserNotes] = useState('');
  const [tonicScrollTrigger, setTonicScrollTrigger] = useState(0);

  // MIDI Player state variables
  const [midiFileName, setMidiFileName] = useState<string>('');
  const [midiNotesList, setMidiNotesList] = useState<{ midi: number, time: number, duration: number, velocity: number }[]>([]);
  const [midiTimelineSlotsState, setMidiTimelineSlotsState] = useState<TimelineSlot[]>([]);
  const [midiDuration, setMidiDuration] = useState<number>(0);
  const [selectedGenreTab, setSelectedGenreTab] = useState<'Classical' | 'Traditional' | 'Custom & Recent'>('Classical');
  const [recentTracks, setRecentTracks] = useState<{ id: string; name: string; isPreset: boolean }[]>([]);
  const [showRemainingTime, setShowRemainingTime] = useState(false);
  const playbackSpeed = 1.0;
  const [defaultMidiBpm, setDefaultMidiBpm] = useState<number>(120);

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

  // ─── MIDI Player Functions ──────────────────────────────────────────────────

  const updateRecentTracks = useCallback((id: string, isPreset: boolean, name: string) => {
    setRecentTracks(prev => {
      const filtered = prev.filter(t => t.id !== id);
      const updated = [{ id, name, isPreset }, ...filtered].slice(0, 10);
      onSaveRecentTracks?.(updated);
      return updated;
    });
  }, [onSaveRecentTracks]);
  const formatMidiTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMidiPlayPause = () => {
    if (audio.isPlaying) {
      audio.pausePlayback();
    } else {
      if (audio.startDirectMidiPlayback) {
        const speedFactor = levelConfig.bpm / (defaultMidiBpm || 120);
        audio.startDirectMidiPlayback(midiNotesList, speedFactor);
      }
    }
  };

  useEffect(() => {
    if (recentTracksProp) {
      setRecentTracks(recentTracksProp);
    }
  }, [recentTracksProp]);

  useEffect(() => {
    if (notesProp) {
      const hash = EXERCISE_HASHES[level];
      setUserNotes((hash ? notesProp[hash] : '') || notesProp[level] || '');
    }
  }, [notesProp, level]);

  const loadMidiFromBuffer = useCallback(async (buffer: ArrayBuffer, name: string, isPreset = false, presetId?: string) => {
    try {
      const { Midi } = await import('@tonejs/midi');
      const midi = new Midi(buffer);

      const absoluteNotes: { midi: number, time: number, duration: number, velocity: number }[] = [];
      const slots: TimelineSlot[] = [];

      let maxTime = 0;

      midi.tracks.forEach(track => {
        track.notes.forEach(note => {
          absoluteNotes.push({
            midi: note.midi,
            time: note.time,
            duration: note.duration,
            velocity: note.velocity,
          });

          if (note.time + note.duration > maxTime) {
            maxTime = note.time + note.duration;
          }
        });
      });

      absoluteNotes.sort((a, b) => a.time - b.time);

      const ppq = midi.header.ppq || 480;
      const bpm = midi.header.tempos[0]?.bpm || 120;
      log.info(`[loadMidiFromBuffer] Started parsing MIDI for: ${name}. Tracks: ${midi.tracks.length}, Total Notes parsed: ${absoluteNotes.length}, Max Time: ${maxTime}, PPQ: ${ppq}, BPM: ${bpm}`);

      const tempConverter = new NoteConverter(
        levelConfig.tonic,
        levelConfig.octave,
        bpm,
        ppq
      );

      // Convert absolute MIDI notes back to PlayedNote[] for melody guide
      const parsedMelody: PlayedNote[] = absoluteNotes.map(note => {
        const beatTicks = Math.round(note.time * ppq * (bpm / 60));
        const durationTicks = Math.round(note.duration * ppq * (bpm / 60));
        const relative = tempConverter.fromMidi(note.midi);
        return {
          note: relative,
          beat: beatTicks,
          duration: durationTicks,
        };
      });
      setMelodyNotes(parsedMelody);

      // Group notes into chords by start time (tolerance of 50ms) for chords guide
      const parsedChords: PlayedChord[] = [];
      const tolerance = 0.05; // 50ms
      const sortedNotes = [...absoluteNotes].sort((a, b) => a.time - b.time);

      let currentChordNotes: { midi: number, time: number, duration: number }[] = [];

      sortedNotes.forEach(note => {
        if (currentChordNotes.length === 0) {
          currentChordNotes.push(note);
        } else {
          const firstTime = currentChordNotes[0].time;
          if (Math.abs(note.time - firstTime) <= tolerance) {
            currentChordNotes.push(note);
          } else {
            // Commit current chord
            const beatTicks = Math.round(firstTime * ppq * (bpm / 60));
            const durationTicks = Math.round(Math.max(...currentChordNotes.map(n => n.duration)) * ppq * (bpm / 60));
            parsedChords.push({
              notes: currentChordNotes.map(n => tempConverter.fromMidi(n.midi)),
              beat: beatTicks,
              duration: durationTicks,
            });
            currentChordNotes = [note];
          }
        }
      });

      if (currentChordNotes.length > 0) {
        const firstTime = currentChordNotes[0].time;
        const beatTicks = Math.round(firstTime * ppq * (bpm / 60));
        const durationTicks = Math.round(Math.max(...currentChordNotes.map(n => n.duration)) * ppq * (bpm / 60));
        parsedChords.push({
          notes: currentChordNotes.map(n => tempConverter.fromMidi(n.midi)),
          beat: beatTicks,
          duration: durationTicks,
        });
      }
      setChords(parsedChords);

      setMidiNotesList(absoluteNotes);
      setMidiTimelineSlotsState(slots);
      setMidiDuration(maxTime);
      setMidiFileName(name);

      setDefaultMidiBpm(Math.round(bpm));
      const savedBpm = settings.midiTempoMap?.[name];
      setLevelConfig(prev => ({
        ...prev,
        bpm: savedBpm ?? Math.round(bpm),
        ticksPerBeat: ppq,
      }));

      const trackState = {
        name,
        isPreset,
        presetId
      };
      onSaveActiveTrack?.(trackState);

      audio.stopPlayback();
      audio.resetStartFlags();
      setActiveTab('practice');

      return absoluteNotes;

    } catch (err) {
      console.error("Error parsing MIDI:", err);
      alert("Failed to parse MIDI file. Ensure it is a valid format.");
      return [];
    }
  }, [levelConfig.tonic, levelConfig.octave, settings.midiTempoMap, onSaveActiveTrack, audio, setActiveTab]);

  const loadMidiPreset = useCallback(async (presetId: string) => {
    log.info(`[loadMidiPreset] Loading preset: ${presetId}`);
    const preset = MIDI_PRESETS.find(p => p.id === presetId);
    if (!preset) {
      log.warn(`[loadMidiPreset] Preset id ${presetId} not found.`);
      return [];
    }

    try {
      log.info(`[loadMidiPreset] Fetching preset asset: ${preset.asset}`);
      const res = await fetch(preset.asset);
      const ab = await res.arrayBuffer();
      const notes = await loadMidiFromBuffer(ab, preset.title, true, preset.id);
      updateRecentTracks(preset.id, true, preset.title);
      return notes;
    } catch (err) {
      log.error("[loadMidiPreset] Error loading preset:", err);
      return [];
    }
  }, [loadMidiFromBuffer, updateRecentTracks]);

  // Auto-load preset when presetId prop is present
  useEffect(() => {
    if (mode === 'midi_player' && presetId) {
      const preset = MIDI_PRESETS.find(p => p.id === presetId);
      if (preset && preset.title === midiFileName) {
        if (action === 'play' && midiNotesList.length > 0) {
          if (audio.startDirectMidiPlayback) {
            const speedFactor = levelConfig.bpm / (defaultMidiBpm || 120);
            audio.startDirectMidiPlayback(midiNotesList, speedFactor);
          }
        }
        return;
      }
      loadMidiPreset(presetId).then(notes => {
        if (action === 'play' && notes && notes.length > 0) {
          if (audio.startDirectMidiPlayback) {
            audio.startDirectMidiPlayback(notes, playbackSpeed);
          }
        }
      });
    }
  }, [presetId, action, mode, loadMidiPreset, audio, playbackSpeed, midiFileName, midiNotesList, levelConfig.bpm, defaultMidiBpm]);

  // Restore active track state from props on mount
  useEffect(() => {
    if (mode === 'midi_player') {
      if (activeTrackProp) {
        try {
          const t = activeTrackProp;
          if (t.name && t.name !== midiFileName) {
            setMidiFileName(t.name);
            if (t.isPreset && t.presetId) {
              loadMidiPreset(t.presetId);
            }
          }
        } catch (err) {
          console.error("Failed to parse active track from props:", err);
        }
      }
    }
  }, [mode, activeTrackProp, midiFileName, loadMidiPreset]);

  // Keep a ref to stopPlayback so the unmount cleanup always calls the latest version
  const stopPlaybackRef = useRef(audio.stopPlayback);
  stopPlaybackRef.current = audio.stopPlayback;

  // Stop playback when component unmounts
  useEffect(() => {
    return () => {
      stopPlaybackRef.current();
    };
  }, []);

  // Pause playback when switching to settings or loader tab
  const pausePlaybackRef = useRef(audio.pausePlayback);
  pausePlaybackRef.current = audio.pausePlayback;

  useEffect(() => {
    if (activeTab === 'settings' || activeTab === 'loader') {
      pausePlaybackRef.current();
    }
  }, [activeTab]);

  // ─── Sync persisted custom tempo ──────────────────────────────────────────

  useEffect(() => {
    if (mode === 'midi_player') {
      if (midiFileName) {
        const customMidiBpm = settings.midiTempoMap?.[midiFileName];
        if (customMidiBpm !== undefined && customMidiBpm !== levelConfig.bpm) {
          setLevelConfig(prev => ({ ...prev, bpm: customMidiBpm }));
        }
      }
    } else {
      const customBpm = settings.tempoMap[level];
      if (customBpm !== undefined && customBpm !== levelConfig.bpm) {
        setLevelConfig(prev => ({ ...prev, bpm: customBpm }));
      }
    }
  }, [settings.tempoMap, settings.midiTempoMap, level, mode, midiFileName, levelConfig.bpm]);

  // ─── Setup ─────────────────────────────────────────────────────────────────

  const setupExercise = (keepCadence = false) => {
    if (mode === 'midi_player') return;
    audio.stopPlayback();
    if (!keepCadence) audio.resetStartFlags();

    const isQueued = mode === 'trainer' && isQueuedLevel(level);
    const persistedBpm = settings.tempoMap[level];
    const buildMode = mode === 'settings' ? 'trainer' : (mode as 'trainer' | 'midi_player' | 'progress');

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

  // ─── Dynamic MIDI Timeline Slots ─────────────────────────────────────────

  const midiTimelineSlots = useMemo(() => {
    if (mode !== 'midi_player') return [];
    const displayLayer = settings.midiDisplayLayer || 'chords';

    const getRelativeNoteLabel = (note: RelativeNote): string => {
      if (note.degree === 0 && note.offset === 1) return '8';
      if (note.degree === 0) return '1';
      if (note.degree === 2) return '2';
      if (note.degree === 4) return '3';
      if (note.degree === 5) return '4';
      if (note.degree === 7) return '5';
      if (note.degree === 9) return '6';
      if (note.degree === 11) return '7';
      const chromaticMap = ['1', '1#', '2', '2#', '3', '4', '4#', '5', '5#', '6', '6#', '7'];
      return chromaticMap[note.degree] || '1';
    };

    const analyzeChord = (notes: RelativeNote[]): string => {
      if (notes.length === 0) return '';
      // Find the lowest note (bass) to guess the chord root
      const bass = notes.reduce((lowest, n) => {
        const lowestVal = lowest.offset * 12 + lowest.degree;
        const nVal = n.offset * 12 + n.degree;
        return nVal < lowestVal ? n : lowest;
      }, notes[0]);

      // Map bass note to Roman Numeral
      const romanMap: Record<number, string> = {
        0: 'I', 2: 'II', 4: 'III', 5: 'IV', 7: 'V', 9: 'VI', 11: 'VII'
      };

      const rootStr = romanMap[bass.degree] || romanMap[bass.degree - 1] || 'I';

      // Simple heuristic for minor quality: if there's a note exactly 3 semitones above the bass
      let hasMinorThird = false;
      let hasMajorThird = false;
      const bassSemi = bass.offset * 12 + bass.degree;

      notes.forEach(n => {
        const nSemi = n.offset * 12 + n.degree;
        const diff = (nSemi - bassSemi) % 12;
        if (diff === 3) hasMinorThird = true;
        if (diff === 4) hasMajorThird = true;
      });

      if (hasMinorThird && !hasMajorThird) return rootStr.toLowerCase(); // 'i', 'ii', 'vi'
      return rootStr; // Major default
    };

    const slots: TimelineSlot[] = [];

    if (displayLayer === 'both' || displayLayer === 'melody') {
      melodyNotes.forEach(m => {
        const internalLabel = getRelativeNoteLabel(m.note);
        slots.push({
          note: m.note,
          beat: m.beat,
          answer: internalLabel,
          correct: true,
          label: displayLabel(internalLabel, settings.melodyLabelSystem, settings.chordLabelSystem, converter.tonicPitchClass),
        });
      });
    }

    if (displayLayer === 'both' || displayLayer === 'chords') {
      chords.forEach(c => {
        const internalLabel = analyzeChord(c.notes);
        const repNote = c.notes.length > 0 ? c.notes[0] : { degree: 0, offset: 0 };
        slots.push({
          note: repNote,
          beat: c.beat,
          answer: internalLabel,
          correct: true,
          label: displayLabel(internalLabel, settings.melodyLabelSystem, settings.chordLabelSystem, converter.tonicPitchClass),
        });
      });
    }

    // Fallback if no parsed melody/chords yet but we have midiTimelineSlotsState
    if (slots.length === 0 && midiTimelineSlotsState.length > 0) {
      return midiTimelineSlotsState;
    }

    // Sort slots by time
    return slots.sort((a, b) => a.beat - b.beat);
  }, [mode, settings.midiDisplayLayer, melodyNotes, chords, settings.melodyLabelSystem, settings.chordLabelSystem, converter.tonicPitchClass, midiTimelineSlotsState]);
  // ─── Progress persistence ───────────────────────────────────────────────────

  const saveProgressStats = (scoreRate: number) => {
    onSaveProgress?.(EXERCISE_HASHES[level], scoreRate);
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

  const slotStates = useMemo(() => {
    const states = {
      melody: new Map<number, boolean>(),
      chord: new Map<number, boolean>(),
    };
    timelineSlots.forEach(s => {
      if (s.chord) {
        states.chord.set(s.beat, s.answer !== null);
      } else {
        states.melody.set(s.beat, s.answer !== null);
      }
    });
    return states;
  }, [timelineSlots]);

  const accuracy = useMemo(() => {
    const totalAnswered = correctCount + wrongCount;
    return totalAnswered > 0 ? (correctCount / totalAnswered) * 100 : 100;
  }, [correctCount, wrongCount]);

  const skipButtonEnabled = useMemo(() => {
    if (currentExerciseIndex < 3) return false;
    const totalAnswered = correctCount + wrongCount;
    if (totalAnswered === 0) return false;
    return accuracy >= 80;
  }, [currentExerciseIndex, accuracy, correctCount, wrongCount]);

  const handleFastForwardClick = () => {
    audio.stopPlayback();
    saveProgressStats(accuracy);
    if (onNextLevel) {
      onNextLevel();
    }
  };

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
      audio.startPlayback(nextEx.melody, nextEx.chords, converter, true, { melody: new Map(), chord: new Map() });
    } else {
      // Completed the entire level/queue!
      // 1. Calculate and save progress stats to props
      const totalSlots = exerciseQueue.reduce((acc, ex) => acc + ex.slots.length, 0);
      const answeredSlots = exerciseQueue.flatMap(ex => ex.slots).filter(s => s.answer !== null);
      const totalCorrect = answeredSlots.filter(s => s.correct).length;
      const scoreRate = Math.round((totalCorrect / (totalSlots || 1)) * 100);
      saveProgressStats(scoreRate);

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
    if (mode === 'midi_player') {
      audio.playTonicRootChord(converter);
    } else {
      audio.playGroundingCadence(converter);
    }
  };

  // Start exercise handler
  const handleStartClick = () => {
    log.info(`[handleStartClick] Clicked. Mode: ${mode}, midiNotesList count: ${midiNotesList.length}`);
    setTonicScrollTrigger((prev) => prev + 1);
    if (mode === 'midi_player') {
      audio.stopPlayback();
      if (audio.startDirectMidiPlayback) {
        const speedFactor = levelConfig.bpm / (defaultMidiBpm || 120);
        log.info(`[handleStartClick] Calling startDirectMidiPlayback. speedFactor: ${speedFactor}, levelConfig.bpm: ${levelConfig.bpm}, defaultMidiBpm: ${defaultMidiBpm}`);
        audio.startDirectMidiPlayback(midiNotesList, speedFactor);
      } else {
        log.error(`[handleStartClick] startDirectMidiPlayback is undefined!`);
      }
    } else {
      audio.stopPlayback();
      audio.startPlayback(melodyNotes, chords, converter, skipCadence, slotStates);
    }
  };

  const handleRestartClick = () => {
    log.info(`[handleRestartClick] Clicked. Mode: ${mode}`);
    audio.stopPlayback();
    if (mode === 'midi_player') {
      if (audio.startDirectMidiPlayback) {
        const speedFactor = levelConfig.bpm / (defaultMidiBpm || 120);
        log.info(`[handleRestartClick] Calling startDirectMidiPlayback to restart. speedFactor: ${speedFactor}`);
        audio.startDirectMidiPlayback(midiNotesList, speedFactor);
      } else {
        log.error(`[handleRestartClick] startDirectMidiPlayback is undefined!`);
      }
    } else {
      if (settings.confirmRestartLevel) {
        setShowRestartModal(true);
      } else {
        setupExercise(false);
      }
    }
  };

  // ─── Dynamic Tab Row Component Helper ──────────────────────────────────────────

  const renderTabButton = (tab: 'practice' | 'theory' | 'settings' | 'loader', icon: React.ReactNode, title: string) => {
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

  /**
   * TrackControls explicitly handles the playback interaction for the user.
   * 
   * BEHAVIOR SPECIFICATION:
   * 1. Start / Restart Exercise Button:
   *    - Initial State: "Start Exercise" (Play icon).
   *    - Start Behavior: Stops any currently playing audio and initiates playback of the full exercise sequence. Sets hasStarted = true, converting the button into the "Restart Level" state.
   *    - Restart Behavior: When clicked in its "Restart" state, it stops playback and initiates a full reset of the entire level (resets the 10-exercise queue and progression stats back to 0), prompting with a confirmation modal if 'confirmRestartLevel' is active.
   * 2. Tonic Reference Button:
   *    - Behavior: Immediately interrupts/stops any active playback and plays the foundational tonic chord. Does not advance the timeline or change the hasStarted state.
   * 3. Chords Guide Button:
   *    - Behavior: Immediately interrupts/stops any active playback and begins playing only the backing chords (silencing the melody).
   * 4. Melody Guide Button:
   *    - Behavior: Immediately interrupts/stops any active playback and begins playing only the melody (silencing the backing chords).
   * 5. DawTimeline Play/Pause Button (External to this component):
   *    - Behavior: Strictly disabled until hasStarted is true. Toggles the isPlaying state, pausing or resuming the active timeline.
   * 6. Next Exercise / Progress Button (External to this component):
   *    - Behavior: Remains disabled until all slots in the current exercise are solved. When clicked, it stops current audio and advances to the next exercise.
   */
  const renderTrackControls = (landscapeMode: boolean = false) => {
    const startBtn = (
      <div
        onMouseEnter={(e) => showTooltip(mode === 'midi_player' ? (audio.hasStarted ? 'Restart Track' : 'Play Track') : (audio.hasStarted ? 'Restart Level' : 'Start Exercise'), e)}
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
            ...(!isInteractable ? domStyles.disabledBtn : domStyles.primaryBtn),
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
            ...((!isInteractable || chords.length === 0) ? domStyles.disabledBtn : domStyles.primaryBtn),
            ...domStyles.practiceControlBtn,
            pointerEvents: (!isInteractable || chords.length === 0) ? 'none' : 'auto',
          }}
          onClick={() => audio.playBackingChordsOnly(chords, converter, slotStates.chord)}
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
            ...((!isInteractable || melodyNotes.length === 0) ? domStyles.disabledBtn : domStyles.primaryBtn),
            ...domStyles.practiceControlBtn,
            pointerEvents: (!isInteractable || melodyNotes.length === 0) ? 'none' : 'auto',
          }}
          onClick={() => audio.playMelodyOnly(melodyNotes, converter, slotStates.melody)}
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

          <div
            onMouseEnter={(e) => showTooltip(skipButtonEnabled ? 'Skip Exercise (Fast Forward)' : 'Requires >80% accuracy after Ex 3', e)}
            onMouseLeave={hideTooltip}
            style={{ display: 'flex' }}
          >
            <button
              disabled={!skipButtonEnabled}
              style={{
                ...(skipButtonEnabled ? domStyles.primaryBtn : domStyles.disabledBtn),
                height: '36px',
                width: '36px',
                padding: 0,
                minWidth: 'auto',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: skipButtonEnabled ? 'auto' : 'none',
                borderColor: skipButtonEnabled ? 'rgba(168, 199, 250, 0.4)' : 'transparent',
              }}
              onClick={handleFastForwardClick}
            >
              <IconFastForward size={16} color={skipButtonEnabled ? "currentColor" : "#4A4D54"} />
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
            mode={mode === 'midi_player' ? 'midi_player' : mode}
            levelConfig={levelConfig}
            setLevelConfig={setLevelConfig}
            midiFileName={mode === 'midi_player' ? midiFileName : undefined}
            defaultMidiBpm={mode === 'midi_player' ? defaultMidiBpm : undefined}
            onExportProgress={onExportProgress}
            onImportProgress={onImportProgress}
          />
        </div>
      </div>
    );
  };

  const renderMidiLoaderView = () => {
    const handleNativeFileSelect = () => {
      onLoadCustomMidi?.(async (name, base64) => {
        try {
          const binaryString = atob(base64);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          await loadMidiFromBuffer(bytes.buffer, name);
          updateRecentTracks(name, false, name);
        } catch (e) {
          console.error("Error loading custom MIDI base64:", e);
        }
      });
    };

    const genres: ('Classical' | 'Traditional' | 'Custom & Recent')[] = [
      'Classical', 'Traditional', 'Custom & Recent'
    ];

    const currentPresets = MIDI_PRESETS.filter(p => p.genre === selectedGenreTab);

    return (
      <div style={{
        width: '100%',
        maxWidth: '700px',
        margin: '0 auto',
        boxSizing: 'border-box' as const,
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '20px',
        padding: '0 10px',
      }}>
        {/* Upload card */}
        <div style={{
          ...domStyles.card,
          background: 'linear-gradient(135deg, rgba(29, 32, 36, 0.95) 0%, rgba(20, 22, 25, 0.95) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          padding: '24px',
          textAlign: 'center',
          borderRadius: '16px',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '28px',
              backgroundColor: 'rgba(168, 199, 250, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#A8C7FA',
            }}>
              <IconUpload size={28} />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#E2E2E6', margin: 0 }}>Import MIDI File</h3>
            <p style={{ fontSize: '14px', color: '#8A92A6', margin: 0, maxWidth: '400px' }}>
              Upload any standard MIDI track. It will be converted completely offline into interactive scale degrees.
            </p>
            <button 
              onClick={handleNativeFileSelect}
              style={{
                marginTop: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                backgroundColor: '#A8C7FA',
                color: '#0A305F',
                borderRadius: '100px',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '15px',
                border: 'none',
                boxShadow: '0 4px 12px rgba(168, 199, 250, 0.15)',
                transition: 'all 0.2s',
            }}>
              <IconFolder size={18} />
              Browse Local Files
            </button>
          </div>
        </div>

        {/* Preset / Recent Browser Card */}
        <div style={{
          ...domStyles.card,
          background: '#1D2024',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid rgba(255, 255, 255, 0.03)',
        }}>
          {/* Genre Tabs */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            marginBottom: '16px',
            overflowX: 'auto',
            gap: '4px',
            paddingBottom: '4px',
          }}>
            {genres.map(genre => (
              <button
                key={genre}
                onClick={() => setSelectedGenreTab(genre)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: selectedGenreTab === genre ? '#A8C7FA' : '#8A92A6',
                  padding: '10px 16px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  borderBottom: selectedGenreTab === genre ? '2px solid #A8C7FA' : '2px solid transparent',
                  whiteSpace: 'nowrap',
                }}
              >
                {genre === 'Custom & Recent' ? 'Recent Tracks' : genre}
              </button>
            ))}
          </div>

          {/* List of items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px', overflowY: 'auto' }}>
            {selectedGenreTab === 'Custom & Recent' ? (
              recentTracks.length === 0 ? (
                <div style={{ padding: '30px 10px', textAlign: 'center', color: '#8A92A6', fontSize: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <IconHistory size={24} style={{ opacity: 0.5 }} />
                  <span>No recent tracks yet. Presets or uploads will appear here.</span>
                </div>
              ) : (
                recentTracks.map(track => (
                  <button
                    key={track.id}
                    onClick={() => track.isPreset ? loadMidiPreset(track.id) : alert("Custom files are processed dynamically. Please browse the file again to play.")}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 16px',
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.03)',
                      borderRadius: '12px',
                      color: '#E2E2E6',
                      cursor: 'pointer',
                      textAlign: 'left' as const,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <IconMusic size={18} color="#A8C7FA" />
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '15px' }}>{track.name}</div>
                        <div style={{ fontSize: '12px', color: '#8A92A6', marginTop: '2px' }}>
                          {track.isPreset ? 'Preset Track' : 'Uploaded File'}
                        </div>
                      </div>
                    </div>
                    <IconArrowRight size={18} color="#8A92A6" />
                  </button>
                ))
              )
            ) : (
              currentPresets.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => loadMidiPreset(preset.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.03)',
                    borderRadius: '12px',
                    color: '#E2E2E6',
                    cursor: 'pointer',
                    textAlign: 'left' as const,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <IconMusic size={18} color="#A8C7FA" />
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '15px' }}>{preset.title}</div>
                      <div style={{ fontSize: '12px', color: '#8A92A6', marginTop: '2px' }}>
                        {preset.composer}
                      </div>
                    </div>
                  </div>
                  <IconArrowRight size={18} color="#8A92A6" />
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderMidiPlayerView = () => {
    if (!midiFileName) {
      return (
        <div style={{
          ...domStyles.card,
          padding: '40px',
          textAlign: 'center',
          maxWidth: '500px',
          margin: '40px auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
        }}>
          <IconMusic size={40} color="#8A92A6" />
          <h3 style={{ margin: 0, color: '#E2E2E6', fontSize: '18px', fontWeight: '800' }}>No Track Loaded</h3>
          <p style={{ margin: 0, color: '#8A92A6', fontSize: '14px', lineHeight: '1.5' }}>
            Please select a preset track or upload a custom MIDI file to start training.
          </p>
          <button
            onClick={() => setActiveTab('loader')}
            style={{
              ...domStyles.primaryBtn,
              padding: '12px 24px',
              borderRadius: '100px',
              fontSize: '14px',
            }}
          >
            Go to Loader
          </button>
        </div>
      );
    }

    const speedFactor = levelConfig.bpm / (defaultMidiBpm || 120);
    const durationSeconds = midiDuration / speedFactor;
    const currentSeconds = audio.playheadTime;
    const remainingSeconds = Math.max(0, durationSeconds - currentSeconds);

    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '24px',
        width: '100%',
        maxWidth: '850px',
        margin: '0 auto',
        padding: '0 10px',
        boxSizing: 'border-box' as const,
      }}>
        {/* Track Title banner */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#1D2024',
          padding: '14px 20px',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.03)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <IconMusic size={20} color="#A8C7FA" />
            <div>
              <div style={{ fontSize: '12px', color: '#8A92A6', fontWeight: '500' }}>Active Track</div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#E2E2E6', marginTop: '2px' }}>{midiFileName}</div>
            </div>
          </div>

          <div
            onClick={() => setShowRemainingTime(!showRemainingTime)}
            style={{
              fontSize: '14px',
              fontFamily: 'monospace',
              color: '#A8C7FA',
              backgroundColor: 'rgba(168, 199, 250, 0.08)',
              padding: '6px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '700',
            }}
          >
            {showRemainingTime ? `-${formatMidiTime(remainingSeconds)}` : formatMidiTime(currentSeconds)} / {formatMidiTime(durationSeconds)}
          </div>
        </div>

        {/* Daw Timeline for MIDI scrubbing */}
        <div style={domStyles.card}>
          <DawTimeline
            level={0}
            timelineSlots={midiTimelineSlots}
            focusedSlotIndex={null}
            playheadTime={currentSeconds}
            isPlaying={audio.isPlaying}
            hasStarted={audio.hasStarted}
            converter={converter}
            onSlotClick={(index, slot) => {
              if (audio.seekPlayback) {
                audio.seekPlayback(converter.ticksToSeconds(slot.beat));
              }
            }}
            onPlayPause={handleMidiPlayPause}
            melodyLabelSystem={settings.melodyLabelSystem}
            chordLabelSystem={settings.chordLabelSystem}
            onSeek={(t) => {
              if (audio.seekPlayback) {
                audio.seekPlayback(t);
              }
            }}
            revealAllLabels={true}
          />
        </div>

        {/* Play controls row */}
        {renderTrackControls(false)}

        {/* Visualizer (if enabled) */}
        {settings.visualizerEnabled && (
          <div style={domStyles.card}>
            <KeyboardVisualizer
              activeNotes={audio.activeNotes}
              onNoteClick={audio.triggerLiveNote}
              baseOctaveMidi={levelConfig.octave * 12 + levelConfig.tonic + 12}
              tonicScrollTrigger={tonicScrollTrigger}
            />
          </div>
        )}
      </div>
    );
  };

  const renderMidiControlsCard = () => {
    const speedFactor = levelConfig.bpm / (defaultMidiBpm || 120);
    const durationSeconds = midiDuration / speedFactor;
    const currentSeconds = audio.playheadTime;
    const remainingSeconds = Math.max(0, durationSeconds - currentSeconds);

    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '16px',
        width: '100%',
      }}>
        {/* Track Title banner */}
        <div style={{
          display: 'flex',
          flexDirection: 'column' as const,
          gap: '12px',
          backgroundColor: '#1D2024',
          padding: '16px 20px',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.03)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <IconMusic size={20} color="#A8C7FA" />
            <div>
              <div style={{ fontSize: '11px', color: '#8A92A6', fontWeight: '500' }}>Active Track</div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#E2E2E6', marginTop: '2px' }}>{midiFileName}</div>
            </div>
          </div>

          <div
            onClick={() => setShowRemainingTime(!showRemainingTime)}
            style={{
              fontSize: '14px',
              fontFamily: 'monospace',
              color: '#A8C7FA',
              backgroundColor: 'rgba(168, 199, 250, 0.08)',
              padding: '6px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '700',
              textAlign: 'center',
              marginTop: '4px',
            }}
          >
            {showRemainingTime ? `-${formatMidiTime(remainingSeconds)}` : formatMidiTime(currentSeconds)} / {formatMidiTime(durationSeconds)}
          </div>
        </div>

        {/* Controls Row */}
        {renderTrackControls(true)}
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
                  {mode === 'midi_player' ? (
                    midiFileName ? (
                      <div style={domStyles.card}>
                        <DawTimeline
                          level={0}
                          timelineSlots={midiTimelineSlots}
                          focusedSlotIndex={null}
                          playheadTime={audio.playheadTime}
                          isPlaying={audio.isPlaying}
                          hasStarted={audio.hasStarted}
                          converter={converter}
                          onSlotClick={(index, slot) => {
                            if (audio.seekPlayback) {
                              audio.seekPlayback(converter.ticksToSeconds(slot.beat));
                            }
                          }}
                          onPlayPause={handleMidiPlayPause}
                          melodyLabelSystem={settings.melodyLabelSystem}
                          chordLabelSystem={settings.chordLabelSystem}
                          onSeek={(t) => {
                            if (audio.seekPlayback) {
                              audio.seekPlayback(t);
                            }
                          }}
                          revealAllLabels={true}
                        />
                      </div>
                    ) : (
                      <div style={{ ...domStyles.card, padding: '20px', textAlign: 'center', color: '#8A92A6' }}>
                        No Track Loaded. Go to Loader.
                      </div>
                    )
                  ) : (
                    <DawTimeline
                      level={level}
                      timelineSlots={timelineSlots}
                      focusedSlotIndex={focusedSlotIndex}
                      playheadTime={audio.playheadTime}
                      isPlaying={audio.isPlaying}
                      hasStarted={audio.hasStarted}
                      converter={converter}
                      onSlotClick={handleSlotClick}
                      onPlayPause={audio.isPlaying ? audio.pausePlayback : () => audio.startPlayback(melodyNotes, chords, converter, skipCadence, slotStates)}
                      melodyLabelSystem={settings.melodyLabelSystem}
                      chordLabelSystem={settings.chordLabelSystem}
                    />
                  )}

                  {settings.visualizerEnabled && (
                    <KeyboardVisualizer
                      activeNotes={audio.activeNotes}
                      onNoteClick={audio.triggerLiveNote}
                      firstNoteMidi={firstPlayedNoteMidi}
                      baseOctaveMidi={mode === 'midi_player' ? (levelConfig.octave * 12 + levelConfig.tonic + 12) : baseOctaveMidi}
                      tonicScrollTrigger={tonicScrollTrigger}
                    />
                  )}
                </div>

                {/* Right Column: Controls, Answers & Progress card */}
                <div style={{ ...domStyles.rightColumn, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {mode === 'midi_player' ? (
                    renderMidiControlsCard()
                  ) : (
                    <>
                      {renderTrackControls(true)}
                      {renderChoicesCard()}
                      {renderProgressCard()}
                    </>
                  )}
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
                {mode === 'midi_player' ? (
                  renderMidiPlayerView()
                ) : (
                  <>
                    <DawTimeline
                      level={level}
                      timelineSlots={timelineSlots}
                      focusedSlotIndex={focusedSlotIndex}
                      playheadTime={audio.playheadTime}
                      isPlaying={audio.isPlaying}
                      hasStarted={audio.hasStarted}
                      converter={converter}
                      onSlotClick={handleSlotClick}
                      onPlayPause={audio.isPlaying ? audio.pausePlayback : () => audio.startPlayback(melodyNotes, chords, converter, skipCadence, slotStates)}
                      melodyLabelSystem={settings.melodyLabelSystem}
                      chordLabelSystem={settings.chordLabelSystem}
                    />

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
                    {renderTrackControls(false)}
                  </>
                )}
              </div>
            )
          )}

          {/* Tab D: Loader */}
          {activeTab === 'loader' && renderMidiLoaderView()}

          {/* Tab B: Full-Page Theory */}
          {activeTab === 'theory' && (
            <TheoryTab
              level={level}
              userNotes={userNotes}
              onSaveNotes={(val) => {
                setUserNotes(val);
                onSaveUserNotes?.(level, val);
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
          {mode === 'midi_player' ? (
            <>
              {renderTabButton('loader', <IconFolder size={22} color="currentColor" />, 'Loader')}
              {renderTabButton('practice', <IconPiano size={22} color="currentColor" />, 'Player')}
              {renderTabButton('settings', <IconCog size={22} color="currentColor" />, 'Settings')}
            </>
          ) : (
            <>
              {renderTabButton('practice', <IconPiano size={22} color="currentColor" />, 'Practice')}
              {renderTabButton('theory', <IconBookOpen size={22} color="currentColor" />, 'Theory')}
              {renderTabButton('settings', <IconCog size={22} color="currentColor" />, 'Settings')}
            </>
          )}
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
                Don&apos;t show this warning again
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

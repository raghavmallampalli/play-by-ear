'use dom';

import React, { useEffect, useRef, useState } from 'react';
import { pianoSamples } from '../constants/piano_samples';

// Unique hashes for indexing training progress
const EXERCISE_HASHES = {
  1: '8f3a9e2b', // Level 1: Root & 5th Interval
  2: '5c4a7e9d', // Level 2: Dynamic Thirds Interval
  3: '3b8d6f1a', // Level 3: Happy Birthday Chords
};

import { marked } from 'marked';
import { EXERCISE_TO_THEORY_MAP, THEORY_REGISTRY } from '../theory/theory_registry';

// Zero-dependency offline-first Markdown Parser using marked
const renderMarkdown = (text: string) => {
  if (!text) return null;
  try {
    const rawHtml = marked.parse(text);
    return (
      <div className="markdown-body" style={{ width: '100%' }}>
        <style dangerouslySetInnerHTML={{
          __html: `
          .markdown-body h1, .markdown-body h2, .markdown-body h3 {
            font-size: 17px;
            font-weight: 800;
            color: #E2E2E6;
            margin: 16px 0 8px 0;
            line-height: 1.3;
          }
          .markdown-body h4, .markdown-body h5 {
            font-size: 14px;
            font-weight: 700;
            color: #A8C7FA;
            margin: 12px 0 6px 0;
            line-height: 1.3;
          }
          .markdown-body p {
            font-size: 12.5px;
            color: #C2C7CF;
            margin: 0 0 10px 0;
            line-height: 1.5;
          }
          .markdown-body ul, .markdown-body ol {
            margin: 0 0 12px 20px;
            padding: 0;
          }
          .markdown-body li {
            font-size: 12.5px;
            color: #C2C7CF;
            margin-bottom: 4px;
            line-height: 1.5;
            list-style-type: disc;
          }
          .markdown-body blockquote {
            border-left: 3px solid #A8C7FA;
            padding-left: 12px;
            margin: 12px 0;
            color: #8A92A6;
            font-style: italic;
            font-size: 12.5px;
          }
          .markdown-body code {
            background-color: rgba(255,255,255,0.06);
            padding: 2px 4px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 11.5px;
            color: #A8C7FA;
          }
          .markdown-body strong {
            color: #E2E2E6;
            font-weight: 700;
          }
          .markdown-body em {
            color: #E2E2E6;
            font-style: italic;
          }
        ` }} />
        <div dangerouslySetInnerHTML={{ __html: rawHtml }} />
      </div>
    );
  } catch (e) {
    console.error("Error parsing markdown:", e);
    return <div style={{ whiteSpace: 'pre-wrap', fontSize: '12.5px', color: '#C2C7CF' }}>{text}</div>;
  }
};

// Inline SVG Vector Icons for premium M3 feel
const IconTonic = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
  </svg>
);

const IconPlay = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
    <polygon points="5 3 19 12 5 21 5 3"></polygon>
  </svg>
);

const IconPause = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
    <rect x="6" y="4" width="4" height="16"></rect>
    <rect x="14" y="4" width="4" height="16"></rect>
  </svg>
);

const IconKeyboard = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
    <rect x="2" y="3" width="20" height="18" rx="2" ry="2"></rect>
    <line x1="6" y1="3" x2="6" y2="21"></line>
    <line x1="10" y1="3" x2="10" y2="21"></line>
    <line x1="14" y1="3" x2="14" y2="21"></line>
    <line x1="18" y1="3" x2="18" y2="21"></line>
  </svg>
);

const IconMelody = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
    <path d="M9 18V5l12-2v13"></path>
    <circle cx="6" cy="18" r="3"></circle>
    <circle cx="18" cy="16" r="3"></circle>
  </svg>
);

const IconRestart = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
  </svg>
);

const IconInfo = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#A8C7FA', flexShrink: 0 }}>
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>
);

interface MidiPlayerDOMProps {
  mode?: 'trainer' | 'sandbox' | 'progress';
  level?: number;
}

export default function MidiPlayerDOM({ mode = 'trainer', level = 1 }: MidiPlayerDOMProps) {
  // Navigation tabs inside Trainer screen
  const [activeTab, setActiveTab] = useState<'practice' | 'theory'>('practice');

  // Exercise states
  const [exerciseNotes, setExerciseNotes] = useState<any[]>([]);
  const [timelineSlots, setTimelineSlots] = useState<any[]>([]);
  const [focusedSlotIndex, setFocusedSlotIndex] = useState<number | null>(null);

  // Custom user markdown notes
  const [userNotes, setUserNotes] = useState<string>('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  // Player playback states
  const [isPlaying, setIsPlaying] = useState(false);
  const [playheadTime, setPlayheadTime] = useState(0);
  const [bpm, setBpm] = useState(120);
  const [activeNotes, setActiveNotes] = useState<number[]>([]);
  const [progressState, setProgressState] = useState<Record<string, any>>({});

  useEffect(() => {
    try {
      const json = getProgressJSON();
      const parsed = JSON.parse(json);
      setProgressState(parsed);
      console.log("[PBE Debug] Loaded progressState:", parsed);
    } catch (e) {
      console.error("[PBE Debug] Error parsing progress in useEffect:", e);
    }
  }, [mode, level]);

  // Web Audio Context & Caching state
  const audioCtxRef = useRef<AudioContext | null>(null);
  const mainGainRef = useRef<GainNode | null>(null);
  const audioBuffersRef = useRef<Map<number, AudioBuffer>>(new Map());

  // Scheduler timing refs
  const schedulerTimerRef = useRef<any>(null);
  const lastTickTimeRef = useRef<number>(0);
  const nextNoteIndexRef = useRef<number>(0);
  const notesRef = useRef<any[]>(exerciseNotes);
  const playheadRef = useRef<number>(0);

  // Keyboard scroll viewport hooks
  const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);
  const keyboardScrollRef = useRef<HTMLDivElement>(null);

  // Build the 88-key piano parameters dynamically
  const isNoteBlack = (midi: number) => {
    return [1, 3, 6, 8, 10].includes(midi % 12);
  };

  const whiteKeys: number[] = [];
  const blackKeysData: Array<{ midi: number; rightOfIndex: number }> = [];

  for (let m = 21; m <= 108; m++) {
    if (!isNoteBlack(m)) {
      whiteKeys.push(m);
    }
  }
  for (let m = 21; m <= 108; m++) {
    if (isNoteBlack(m)) {
      const leftWhiteIndex = whiteKeys.indexOf(m - 1);
      if (leftWhiteIndex !== -1) {
        blackKeysData.push({ midi: m, rightOfIndex: leftWhiteIndex });
      }
    }
  }

  // Keyboard layout resizing listener
  useEffect(() => {
    const handleResize = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync parameters
  useEffect(() => {
    notesRef.current = exerciseNotes;
  }, [exerciseNotes]);

  useEffect(() => {
    playheadRef.current = playheadTime;
  }, [playheadTime]);

  // Load level configurations or dynamic generators upon startup
  useEffect(() => {
    setupExercise();
    loadUserNotes();
  }, [level, mode]);

  // Dynamically resolve theory markdown from the current active level
  const getCurrentLevelTheory = () => {
    const exerciseHash = EXERCISE_HASHES[level as keyof typeof EXERCISE_HASHES];
    const theoryHash = EXERCISE_TO_THEORY_MAP[exerciseHash];
    return THEORY_REGISTRY[theoryHash] || "### Under Construction\n\nThere is no theory guide mapped for this level yet.";
  };

  // Load custom markdown notes from storage
  const loadUserNotes = () => {
    try {
      const stored = localStorage.getItem(`@pbe_notes_lvl_${level}`);
      if (stored) {
        setUserNotes(stored);
      } else {
        setUserNotes('');
      }
    } catch (e) {
      console.error(`[PBE Error] Failed to read user notes for level ${level} from localStorage:`, e);
    }
  };

  // Save custom markdown notes to storage
  const handleSaveNotes = (val: string) => {
    setUserNotes(val);
    try {
      localStorage.setItem(`@pbe_notes_lvl_${level}`, val);
      console.info(`[PBE Info] Memory notes updated for level ${level}. Length: ${val.length} characters.`);
    } catch (e) {
      console.error(`[PBE Error] Failed to write memory notes for level ${level} to localStorage:`, e);
    }
  };

  // Audio Context Setup
  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();

      // Hardware Gain Booster (1.6x volume increase, no sliders)
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(1.6, ctx.currentTime);
      gain.connect(ctx.destination);

      audioCtxRef.current = ctx;
      mainGainRef.current = gain;

      // Start preloading all 88 keys asynchronously in background
      preloadAllSamples();
    } else if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  // Preloads and decodes local Grand Piano require MP3s
  const preloadSample = async (midi: number) => {
    if (audioBuffersRef.current.has(midi)) return;
    const asset = pianoSamples[midi];
    if (!asset) return;

    try {
      const res = await fetch(asset);
      const arrayBuffer = await res.arrayBuffer();
      if (audioCtxRef.current) {
        const decoded = await audioCtxRef.current.decodeAudioData(arrayBuffer);
        audioBuffersRef.current.set(midi, decoded);
      }
    } catch (err) {
      // Fallback fails silently
    }
  };

  const preloadAllSamples = () => {
    const priorityKeys = [60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 77, 79, 81, 83];
    priorityKeys.forEach(preloadSample);

    Object.keys(pianoSamples).forEach(key => {
      preloadSample(Number(key));
    });
  };

  // Sets up the Trainer score and timeline slots
  const setupExercise = () => {
    stopPlayback();
    setFocusedSlotIndex(0);

    if (mode === 'sandbox') {
      setExerciseNotes(getDefaultSandboxNotes());
      setTimelineSlots([]);
      return;
    }

    if (level === 1) {
      // Level 1: Dynamic Interval Generator (P1 & P5 only)
      const generated = [];
      const slots = [];
      const choices = [60, 67]; // C4 (P1), G4 (P5)

      for (let i = 0; i < 4; i++) {
        const randMidi = choices[Math.floor(Math.random() * choices.length)];
        const onsetTime = i * 2.0;
        generated.push({
          midi: randMidi,
          time: onsetTime,
          duration: 1.5,
          velocity: 0.85
        });
        slots.push({
          midi: randMidi,
          time: onsetTime,
          answer: null,
          correct: false,
          label: randMidi === 60 ? 'P1' : 'P5'
        });
      }
      setExerciseNotes(generated);
      setTimelineSlots(slots);
      setBpm(100);
    } else if (level === 2) {
      // Level 2: Dynamic Interval Generator (P1, M3, & P5)
      const generated = [];
      const slots = [];
      const choices = [60, 64, 67]; // C4 (P1), E4 (M3), G4 (P5)

      for (let i = 0; i < 4; i++) {
        const randMidi = choices[Math.floor(Math.random() * choices.length)];
        const onsetTime = i * 2.0;
        generated.push({
          midi: randMidi,
          time: onsetTime,
          duration: 1.5,
          velocity: 0.85
        });
        slots.push({
          midi: randMidi,
          time: onsetTime,
          answer: null,
          correct: false,
          label: randMidi === 60 ? 'P1' : randMidi === 64 ? 'M3' : 'P5'
        });
      }
      setExerciseNotes(generated);
      setTimelineSlots(slots);
      setBpm(100);
    } else if (level === 3) {
      // Level 3: Song Dictation - Happy Birthday chords in 3/4 time
      const songNotes: any[] = [];
      const slots: any[] = [];

      const addChord = (time: number, chordType: 'I' | 'IV' | 'V', duration: number) => {
        const pitches = chordType === 'I' ? [48, 52, 55, 60] // C3, E3, G3, C4
          : chordType === 'IV' ? [41, 45, 48, 65] // F2, A2, C3, F4
            : [43, 47, 50, 67]; // G2, B2, D3, G4 (V)

        pitches.forEach(pitch => {
          songNotes.push({
            midi: pitch,
            time: time,
            duration: duration,
            velocity: 0.65,
            isChord: true
          });
        });

        const melodyPitch = chordType === 'I' ? 64 : chordType === 'IV' ? 65 : 67;
        songNotes.push({
          midi: melodyPitch,
          time: time + 0.1,
          duration: duration * 0.8,
          velocity: 0.85
        });

        slots.push({
          midi: pitches[0],
          chord: chordType,
          time: time,
          answer: null,
          correct: false,
          label: chordType
        });
      };

      addChord(0.0, 'I', 2.8);
      addChord(3.0, 'V', 2.8);
      addChord(6.0, 'I', 2.8);
      addChord(9.0, 'IV', 2.8);
      addChord(12.0, 'I', 2.8);

      setExerciseNotes(songNotes);
      setTimelineSlots(slots);
      setBpm(110);
    }
  };

  const getDefaultSandboxNotes = () => {
    const notes: any[] = [];
    const addChordAndMelody = (time: number, chord: number[], melody: number[], duration: number) => {
      chord.forEach(p => notes.push({ midi: p, time, duration: duration * 0.98, velocity: 0.55 }));
      const step = duration / melody.length;
      melody.forEach((p, i) => notes.push({ midi: p, time: time + i * step, duration: step * 0.85, velocity: 0.8 }));
    };
    addChordAndMelody(0.0, [48, 55, 60, 64, 67, 71], [72, 76, 79, 83], 3.0);
    addChordAndMelody(3.0, [45, 52, 57, 60, 64, 67], [81, 79, 76, 72], 3.0);
    addChordAndMelody(6.0, [41, 48, 53, 57, 60, 64, 69], [77, 81, 84, 88], 3.0);
    addChordAndMelody(9.0, [43, 50, 55, 59, 62, 65, 67], [79, 77, 74, 71], 3.0);
    return notes;
  };

  // Play audio notes inside Scheduler
  const playSynthNote = (ctx: AudioContext, midi: number, startTime: number, duration: number, velocity: number) => {
    if (!mainGainRef.current) return;

    const cachedBuffer = audioBuffersRef.current.get(midi);
    if (cachedBuffer) {
      const source = ctx.createBufferSource();
      source.buffer = cachedBuffer;

      const voiceGain = ctx.createGain();
      const volumeCompensation = velocity * 1.45;

      voiceGain.gain.setValueAtTime(0, startTime);
      voiceGain.gain.linearRampToValueAtTime(volumeCompensation, startTime + 0.005);
      voiceGain.gain.setValueAtTime(volumeCompensation, startTime + duration);
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration + 0.8);

      source.connect(voiceGain).connect(mainGainRef.current);
      source.start(startTime);
      source.stop(startTime + duration + 0.95);

      triggerUiHighlight(midi, startTime, duration);
      return;
    }

    preloadSample(midi);

    const freq = 440 * Math.pow(2, (midi - 69) / 12);
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const voiceGain = ctx.createGain();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, startTime);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq / 2, startTime);

    const peakVolume = velocity * 0.16;
    voiceGain.gain.setValueAtTime(0, startTime);
    voiceGain.gain.linearRampToValueAtTime(peakVolume, startTime + 0.008);
    voiceGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration + 0.6);

    osc1.connect(voiceGain).connect(mainGainRef.current);
    osc2.connect(voiceGain).connect(mainGainRef.current);

    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(startTime + duration + 0.7);
    osc2.stop(startTime + duration + 0.7);

    triggerUiHighlight(midi, startTime, duration);
  };

  const triggerUiHighlight = (midi: number, startTime: number, duration: number) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    const triggerMs = Math.max(0, (startTime - ctx.currentTime) * 1000);
    const durationMs = duration * 1000;

    setTimeout(() => {
      setActiveNotes(prev => [...prev, midi]);
    }, triggerMs);

    setTimeout(() => {
      setActiveNotes(prev => prev.filter(n => n !== midi));
    }, triggerMs + durationMs);
  };

  const triggerLiveNote = (midi: number) => {
    initAudio();
    if (audioCtxRef.current) {
      playSynthNote(audioCtxRef.current, midi, audioCtxRef.current.currentTime, 0.45, 0.95);
    }
  };

  // Tonic single tap & double tap cadet grounding progressions
  let lastTonicClick = 0;
  const handleTonicClick = () => {
    const now = Date.now();
    if (now - lastTonicClick < 320) {
      playGroundingCadence();
    } else {
      playTonicRootChord();
    }
    lastTonicClick = now;
  };

  const playTonicRootChord = () => {
    initAudio();
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const now = ctx.currentTime;
    playSynthNote(ctx, 48, now, 1.8, 0.8);
    playSynthNote(ctx, 52, now + 0.02, 1.8, 0.8);
    playSynthNote(ctx, 55, now + 0.04, 1.8, 0.8);
    playSynthNote(ctx, 60, now + 0.06, 1.8, 0.8);
  };

  const playGroundingCadence = () => {
    initAudio();
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const now = ctx.currentTime;

    const playChordAt = (time: number, pitches: number[], duration: number) => {
      pitches.forEach((p, idx) => {
        playSynthNote(ctx, p, now + time + idx * 0.015, duration, 0.7);
      });
    };

    playChordAt(0.0, [48, 52, 55, 60], 0.7);
    playChordAt(0.8, [41, 45, 48, 65], 0.7);
    playChordAt(1.6, [43, 47, 50, 67], 0.7);
    playChordAt(2.4, [48, 52, 55, 60], 1.2);
  };

  // High-precision metric scheduler
  const runScheduler = () => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    const lookahead = 0.15;
    const speedFactor = bpm / 120;
    const now = ctx.currentTime;
    const elapsedRealTime = now - lastTickTimeRef.current;
    lastTickTimeRef.current = now;

    let newPlayhead = playheadRef.current + elapsedRealTime * speedFactor;

    const maxDuration = level === 3 ? 15.0 : 8.0;
    if (newPlayhead >= maxDuration) {
      newPlayhead = 0;
      nextNoteIndexRef.current = 0;
    }
    setPlayheadTime(newPlayhead);

    const scheduleWindowEnd = newPlayhead + lookahead;
    const notes = notesRef.current;

    while (
      nextNoteIndexRef.current < notes.length &&
      notes[nextNoteIndexRef.current].time < scheduleWindowEnd
    ) {
      const note = notes[nextNoteIndexRef.current];
      if (note.time >= newPlayhead) {
        const offsetMidiSeconds = note.time - newPlayhead;
        const realWorldOffset = offsetMidiSeconds / speedFactor;
        const scheduleTime = now + realWorldOffset;

        playSynthNote(ctx, note.midi, scheduleTime, note.duration, note.velocity || 0.8);
      }
      nextNoteIndexRef.current++;
    }
  };

  const startPlayback = () => {
    initAudio();
    if (isPlaying) return;

    setIsPlaying(true);
    lastTickTimeRef.current = audioCtxRef.current!.currentTime;

    let startIndex = 0;
    while (startIndex < exerciseNotes.length && exerciseNotes[startIndex].time < playheadTime) {
      startIndex++;
    }
    nextNoteIndexRef.current = startIndex;
    schedulerTimerRef.current = setInterval(runScheduler, 25);
  };

  const pausePlayback = () => {
    if (schedulerTimerRef.current) {
      clearInterval(schedulerTimerRef.current);
      schedulerTimerRef.current = null;
    }
    setIsPlaying(false);
  };

  const stopPlayback = () => {
    pausePlayback();
    setPlayheadTime(0);
    setActiveNotes([]);
    nextNoteIndexRef.current = 0;
  };

  const playBackingChordsOnly = () => {
    initAudio();
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const now = ctx.currentTime;

    exerciseNotes.forEach(note => {
      if (note.isChord || note.midi < 60) {
        playSynthNote(ctx, note.midi, now + note.time, note.duration, 0.75);
      }
    });
  };

  const playMelodyOnly = () => {
    initAudio();
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const now = ctx.currentTime;

    exerciseNotes.forEach(note => {
      if (!note.isChord && note.midi >= 60) {
        playSynthNote(ctx, note.midi, now + note.time, note.duration, 0.85);
      }
    });
  };

  // Timeline slots input evaluation
  const handleAnswerInput = (choice: string) => {
    if (focusedSlotIndex === null) return;

    const slots = [...timelineSlots];
    const target = slots[focusedSlotIndex];
    target.answer = choice;

    target.correct = target.label === choice;
    setTimelineSlots(slots);

    triggerLiveNote(target.midi);

    let nextIndex = focusedSlotIndex + 1;
    if (nextIndex < slots.length) {
      setFocusedSlotIndex(nextIndex);
    }

    if (slots.every(s => s.answer !== null)) {
      saveProgressStats(slots.filter(s => s.correct).length, slots.length);
    }
  };

  // Tracks persistent Ear-Trainer levels tried & average/best scores
  const saveProgressStats = (correctCount: number, total: number) => {
    const hash = EXERCISE_HASHES[level as keyof typeof EXERCISE_HASHES];
    if (!hash) return;

    const rate = Math.round((correctCount / total) * 100);
    try {
      const statsKey = `@pbe_progress_${hash}`;
      const existing = localStorage.getItem(statsKey);
      let tried = 1;
      let average = rate;
      let best = rate;

      if (existing) {
        const data = JSON.parse(existing);
        tried = (data.timesTried || 0) + 1;
        best = Math.max(data.bestSuccess || 0, rate);
        average = Math.round(((data.averageSuccess || 0) * (tried - 1) + rate) / tried);
      }

      localStorage.setItem(statsKey, JSON.stringify({
        timesTried: tried,
        averageSuccess: average,
        bestSuccess: best
      }));
    } catch (e) { }
  };

  const handleRestart = () => {
    setupExercise();
  };

  // Progress screen export data functions
  const getProgressJSON = () => {
    const profile: Record<string, any> = {};
    Object.entries(EXERCISE_HASHES).forEach(([lvl, hash]) => {
      try {
        const raw = localStorage.getItem(`@pbe_progress_${hash}`);
        if (raw) profile[hash] = JSON.parse(raw);
      } catch (e) { }
    });
    return JSON.stringify(profile, null, 2);
  };

  const handleImportProgress = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      Object.entries(parsed).forEach(([hash, data]) => {
        localStorage.setItem(`@pbe_progress_${hash}`, JSON.stringify(data));
      });
      console.info("[PBE Info] Progress successfully synchronized and stored from imported backup file.");
      alert('Progress successfully synchronized!');
      setupExercise();
    } catch (e) {
      console.error("[PBE Error] Malformed progress backup file load failed. JSON syntax parsing error:", e);
      alert('Failed to parse JSON. Please select a valid progress profile.');
    }
  };

  const handleExportFile = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(getProgressJSON());
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "play-by-ear-progress.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        handleImportProgress(text);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // CSS keyboard positioning parameters (A0 to C8 visible dimensions)
  const getVisibleWidthStyles = () => {
    const keysCount = isLandscape ? 14 : 8.4;
    // Bounded by the 520px max-width wrapper, accounting for body gutters
    const containerWidth = Math.min(window.innerWidth, 520) - 36;
    const whiteKeyWidth = Math.floor(containerWidth / keysCount);
    return {
      whiteKeyWidth,
      keyboardRowWidth: 52 * whiteKeyWidth
    };
  };

  const { whiteKeyWidth, keyboardRowWidth } = getVisibleWidthStyles();

  // Scroll keyboard to focused registers automatically
  useEffect(() => {
    if (keyboardScrollRef.current) {
      const c4Offset = 23 * whiteKeyWidth - window.innerWidth / 2;
      keyboardScrollRef.current.scrollLeft = c4Offset;
    }
  }, [whiteKeyWidth]);

  // Dynamic CSS linear-gradient octave desaturated colors
  const getKeyHighlight = (midi: number) => {
    const isActive = activeNotes.includes(midi);
    if (!isActive) return null;

    // Beautiful desaturated organic palette per octave
    const octaveColors: Record<number, string> = {
      0: '#7C8BFC', 1: '#7C8BFC', // Octaves 0-1: Desaturated Indigo
      2: '#6ED0C2', // Octave 2: Desaturated Teal
      3: '#84D495', // Octave 3: Desaturated Green
      4: '#E5C275', // Octave 4: Desaturated Amber
      5: '#E88AB8', // Octave 5: Desaturated Rose
      6: '#EC8787', 7: '#EC8787', 8: '#EC8787' // Octaves 6-8: Desaturated Coral
    };

    const oct = Math.floor(midi / 12) - 1;
    return octaveColors[oct] || '#A8C7FA';
  };

  const getAnswerChoices = () => {
    if (level === 1) return ['P1', 'P5'];
    if (level === 2) return ['P1', 'M3', 'P5'];
    return ['I', 'IV', 'V'];
  };

  if (mode === 'progress') {
    const triggerFilePicker = () => {
      document.getElementById('import-file-picker')?.click();
    };

    let hasProgress = false;
    try {
      const progressData = JSON.parse(getProgressJSON());
      hasProgress = Object.keys(progressData).length > 0;
    } catch (e) { }

    return (
      <div style={domStyles.body}>
        <div style={domStyles.wrapper}>
          <div style={domStyles.card}>
            <h2 style={domStyles.sectionTitle}>Sync and Save Progress</h2>
            <p style={domStyles.metaLabel}>Backup your training profile directly to your device disk as a JSON file, or restore a previously saved file.</p>

            <div style={domStyles.notesDivider} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
              <button
                style={hasProgress ? domStyles.gridBtnPlay : domStyles.gridBtnDisabled}
                onClick={hasProgress ? handleExportFile : undefined}
                disabled={!hasProgress}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Export Progress to Disk
              </button>

              <button style={domStyles.gridBtn} onClick={triggerFilePicker}>
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                Import Progress from Disk
              </button>

              {/* Hidden file input */}
              <input
                type="file"
                id="import-file-picker"
                accept=".json"
                style={{ display: 'none' }}
                onChange={handleImportFileChange}
              />
            </div>

            <div style={domStyles.openSourceBadge}>
              <IconInfo />
              <p style={domStyles.openSourceText}>
                Imported profiles immediately synchronize with your local storage, seamlessly updating your training statistics offline.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            {/* Core Controls: 2x2 Grid Layout */}
            <div style={domStyles.gridControls}>
              <button style={domStyles.gridBtn} onClick={handleTonicClick}>
                <IconTonic /> Tonic
              </button>
              <button style={domStyles.gridBtnPlay} onClick={isPlaying ? pausePlayback : startPlayback}>
                {isPlaying ? <IconPause /> : <IconPlay />} {isPlaying ? 'Pause' : 'Play Song'}
              </button>
              <button style={domStyles.gridBtn} onClick={playBackingChordsOnly}>
                <IconKeyboard /> Root Chords
              </button>
              <button style={domStyles.gridBtn} onClick={playMelodyOnly}>
                <IconMelody /> Just Melody
              </button>
            </div>

            {/* DAW metric timeline grids */}
            {mode === 'trainer' && (
              <div style={domStyles.card}>
                <h3 style={domStyles.cardLabel}>Timeline Sequence</h3>
                <div style={domStyles.dawTimeline}>
                  <div style={domStyles.dawGridOverlay}>
                    {Array.from({ length: 24 }).map((_, i) => (
                      <div
                        key={i}
                        style={{
                          ...domStyles.dawGridLine,
                          borderLeft: i % 4 === 0
                            ? '1px dashed rgba(255,255,255,0.12)'
                            : '1px dotted rgba(255,255,255,0.04)',
                          left: `${(i / 24) * 100}%`
                        }}
                      />
                    ))}
                  </div>

                  {/* Proportional metric mystery slots */}
                  {timelineSlots.map((slot, index) => {
                    const isFocused = focusedSlotIndex === index;
                    const maxTime = level === 3 ? 15.0 : 8.0;
                    const leftPos = `${(slot.time / maxTime) * 88}%`;

                    let slotColor = 'rgba(255, 255, 255, 0.03)';
                    let border = '1px solid rgba(255, 255, 255, 0.08)';
                    if (slot.answer !== null) {
                      slotColor = slot.correct ? 'rgba(196, 231, 196, 0.15)' : 'rgba(242, 184, 181, 0.15)';
                      border = slot.correct ? '2px solid #C4E7C4' : '2px solid #F2B8B5';
                    } else if (isFocused) {
                      slotColor = 'rgba(168, 199, 250, 0.15)';
                      border = '2px solid #A8C7FA';
                    }

                    return (
                      <button
                        key={index}
                        style={{
                          ...domStyles.dawSlot,
                          left: leftPos,
                          backgroundColor: slotColor,
                          border: border,
                          boxShadow: isFocused ? '0 0 8px rgba(168, 199, 250, 0.3)' : 'none'
                        }}
                        onClick={() => setFocusedSlotIndex(index)}
                      >
                        <span style={domStyles.dawSlotText}>
                          {slot.answer !== null ? slot.answer : '?'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Scrollable Piano Visualizer */}
            <div style={domStyles.keyboardLabelRow}>
              <span>Keyboard Visualizer (Drag horizontally to scroll A0 - C8)</span>
            </div>

            <div style={domStyles.pianoScrollFrame} ref={keyboardScrollRef}>
              <div style={{ ...domStyles.pianoInnerRow, width: keyboardRowWidth }}>

                {/* White Keys */}
                {whiteKeys.map((midi, index) => {
                  const highlightColor = getKeyHighlight(midi);
                  return (
                    <div
                      key={midi}
                      style={{
                        ...domStyles.whiteKey,
                        width: whiteKeyWidth,
                        backgroundColor: highlightColor || '#E2E2E6',
                        boxShadow: highlightColor ? `inset 0 -20px 0 ${highlightColor}` : 'none',
                        borderLeft: index === 0 ? '1px solid #1D2024' : 'none',
                      }}
                      onClick={() => triggerLiveNote(midi)}
                    />
                  );
                })}

                {/* Absolutely positioned proportional black keys */}
                {blackKeysData.map(({ midi, rightOfIndex }) => {
                  const highlightColor = getKeyHighlight(midi);
                  const blackKeyWidth = Math.floor(whiteKeyWidth * 0.58);
                  const leftPos = (rightOfIndex + 1) * whiteKeyWidth - (blackKeyWidth / 2);

                  return (
                    <div
                      key={midi}
                      style={{
                        ...domStyles.blackKey,
                        left: leftPos,
                        width: blackKeyWidth,
                        backgroundColor: highlightColor || '#14171E',
                        border: highlightColor ? `1.5px solid ${highlightColor}` : '1px solid #000',
                        boxShadow: highlightColor ? `0 0 8px ${highlightColor}` : 'none'
                      }}
                      onClick={() => triggerLiveNote(midi)}
                    />
                  );
                })}

              </div>
            </div>

            {/* Answer Selector Controls & Restart */}
            {mode === 'trainer' && (
              <div style={domStyles.card}>
                <div style={domStyles.answerContainer}>
                  <p style={domStyles.metaLabel}>Select Correct Relative Pitch:</p>
                  <div style={domStyles.answerRow}>
                    {getAnswerChoices().map(choice => (
                      <button
                        key={choice}
                        style={domStyles.answerBtn}
                        onClick={() => handleAnswerInput(choice)}
                      >
                        {choice}
                      </button>
                    ))}
                    <button style={domStyles.restartBtn} onClick={handleRestart}>
                      <IconRestart /> Restart
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Contextual Theory & Collaborative Markdown Notes page */
          <div style={domStyles.card}>
            <div style={domStyles.theoryContent}>
              {renderMarkdown(getCurrentLevelTheory())}
            </div>

            <div style={domStyles.notesDivider} />

            {!isEditingNotes && userNotes.trim().length === 0 ? (
              <button
                style={domStyles.addNotesBtn}
                onClick={() => {
                  setIsEditingNotes(true);
                  console.log("[PBE Debug] Notes: Initiated memory notes editing mode.");
                }}
              >
                <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                </svg>
                Add Notes
              </button>
            ) : isEditingNotes ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                <textarea
                  autoFocus
                  placeholder="Type your notes or memory tricks here using standard markdown..."
                  value={userNotes}
                  onChange={(e) => handleSaveNotes(e.target.value)}
                  onBlur={() => {
                    setIsEditingNotes(false);
                  }}
                  style={domStyles.textareaEditable}
                />
                <button
                  style={domStyles.doneNotesBtn}
                  onClick={() => {
                    setIsEditingNotes(false);
                  }}
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '5px' }}>
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Done Editing
                </button>
              </div>
            ) : (
              <div
                style={domStyles.renderedNotesCardInteractive}
                onClick={() => {
                  setIsEditingNotes(true);
                  console.log("[PBE Debug] Notes: Opened memory notes editing mode via card click.");
                }}
                title="Click to edit notes"
              >
                <div style={domStyles.cardHeaderEditLabel}>
                  <span style={{ fontSize: '11px', color: '#8A92A6', fontWeight: '700' }}>YOUR MEMORY NOTES</span>
                  <span style={{ fontSize: '10px', color: '#A8C7FA', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <svg viewBox="0 0 24 24" width="11" height="11" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9"></path>
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                    </svg>
                    CLICK TO EDIT
                  </span>
                </div>
                {renderMarkdown(userNotes)}
              </div>
            )}

            {/* Open Source Contribution Badge */}
            <div style={domStyles.openSourceBadge}>
              <IconInfo />
              <p style={domStyles.openSourceText}>
                <strong>Open Source relative pitch trainer.</strong> We welcome you to improve this theory guide or notes! Copy/edit this markdown and submit a PR to our repository.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// Breathtaking desaturated Material 3 dark styles
const markdownStyles = {
  h3: {
    fontSize: '18px',
    fontWeight: '800',
    color: '#E2E2E6',
    margin: '12px 0 6px 0',
  },
  h4: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#A8C7FA',
    margin: '10px 0 4px 0',
  },
  li: {
    fontSize: '12.5px',
    color: '#C2C7CF',
    marginLeft: '14px',
    marginBottom: '4px',
    lineHeight: '18px',
  },
  blockquote: {
    borderLeft: '3px solid #A8C7FA',
    paddingLeft: '12px',
    margin: '8px 0',
    color: '#8A92A6',
    fontStyle: 'italic',
    fontSize: '12px',
  },
  p: {
    fontSize: '12.5px',
    color: '#C2C7CF',
    margin: '0 0 8px 0',
    lineHeight: '18px',
  }
} as const;

const domStyles = {
  body: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    backgroundColor: '#111318', // M3 Dark Background
    minHeight: '100%',
    display: 'flex',
    justifyContent: 'center',
    padding: '12px',
    color: '#E2E2E6',
    boxSizing: 'border-box' as const,
    overflowX: 'hidden' as const,
  },
  wrapper: {
    width: '100%',
    maxWidth: '520px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  tabRow: {
    flexDirection: 'row' as const,
    display: 'flex',
    gap: '12px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    paddingBottom: '8px',
  },
  tabBtn: {
    flex: 1,
    padding: '10px',
    borderRadius: '12px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#8A92A6',
    fontWeight: '700' as const,
    cursor: 'pointer',
    fontSize: '13px',
  },
  activeTabBtn: {
    flex: 1,
    padding: '10px',
    borderRadius: '12px',
    backgroundColor: 'rgba(168, 199, 250, 0.08)',
    border: '1px solid rgba(168, 199, 250, 0.2)',
    color: '#A8C7FA',
    fontWeight: '800' as const,
    cursor: 'pointer',
    fontSize: '13px',
  },
  gridControls: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  gridBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '14px',
    borderRadius: '16px',
    backgroundColor: '#25282F', // M3 Secondary Container
    border: '1px solid rgba(255,255,255,0.04)',
    color: '#E2E2E6',
    fontSize: '14px',
    fontWeight: '800' as const,
    cursor: 'pointer',
    textAlign: 'center' as const,
  },
  gridBtnPlay: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '14px',
    borderRadius: '16px',
    backgroundColor: '#A8C7FA', // M3 Primary
    border: 'none',
    color: '#0A305F', // M3 OnPrimary Contrast
    fontSize: '14px',
    fontWeight: '900' as const,
    cursor: 'pointer',
    textAlign: 'center' as const,
  },
  gridBtnDisabled: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '14px',
    borderRadius: '16px',
    backgroundColor: '#25282F',
    border: 'none',
    color: '#53565F',
    fontSize: '14px',
    fontWeight: '800' as const,
    cursor: 'not-allowed',
    textAlign: 'center' as const,
    opacity: 0.5,
  },
  card: {
    backgroundColor: '#1D2024', // M3 Surface Container
    border: '1px solid rgba(255, 255, 255, 0.04)',
    borderRadius: '24px',
    padding: '18px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  cardLabel: {
    fontSize: '12px',
    color: '#8A92A6',
    fontWeight: '700' as const,
    margin: '0',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  dawTimeline: {
    width: '100%',
    height: '60px',
    position: 'relative' as const,
    backgroundColor: '#111318',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.03)',
    overflow: 'hidden' as const,
    display: 'flex',
    alignItems: 'center',
  },
  dawGridOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none' as const,
  },
  dawGridLine: {
    position: 'absolute' as const,
    top: 0,
    height: '100%',
  },
  dawSlot: {
    position: 'absolute' as const,
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
  },
  dawSlotText: {
    fontSize: '11px',
    fontWeight: '950' as const,
    color: '#E2E2E6',
  },
  keyboardLabelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px',
    color: '#8A92A6',
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    textAlign: 'center' as const,
  },
  pianoScrollFrame: {
    width: '100%',
    height: '160px',
    backgroundColor: '#111318',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    overflowX: 'auto' as const,
    padding: '4px',
    boxSizing: 'border-box' as const,
    userSelect: 'none' as const,
  },
  pianoInnerRow: {
    height: '100%',
    position: 'relative' as const,
    display: 'flex',
  },
  whiteKey: {
    height: '100%',
    backgroundColor: '#E2E2E6',
    borderRight: '1px solid #1D2024',
    borderBottom: '1px solid #1D2024',
    borderRadius: '0 0 5px 5px',
    cursor: 'pointer',
    boxSizing: 'border-box' as const,
  },
  blackKey: {
    position: 'absolute' as const,
    top: '0px',
    height: '100px',
    borderRadius: '0 0 4px 4px',
    cursor: 'pointer',
    zIndex: 100,
    boxShadow: '0 3px 5px rgba(0,0,0,0.5)',
    boxSizing: 'border-box' as const,
  },
  answerContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  answerRow: {
    display: 'flex',
    flexDirection: 'row' as const,
    gap: '12px',
    alignItems: 'center',
    overflowX: 'auto' as const,
  },
  answerBtn: {
    width: '54px',
    height: '54px',
    borderRadius: '50%',
    backgroundColor: '#A8C7FA', // M3 Primary
    border: 'none',
    color: '#0A305F',
    fontSize: '15px',
    fontWeight: '900' as const,
    cursor: 'pointer',
  },
  restartBtn: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 18px',
    borderRadius: '24px',
    backgroundColor: '#25282F', // M3 Secondary Container
    border: '1px solid rgba(255, 255, 255, 0.05)',
    color: '#E2E2E6',
    fontSize: '12px',
    fontWeight: '800' as const,
    cursor: 'pointer',
    marginLeft: 'auto',
  },
  metaLabel: {
    fontSize: '11px',
    color: '#8A92A6',
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
    margin: '0 0 4px 0',
  },
  sectionTitle: {
    fontSize: '15px',
    fontWeight: '800' as const,
    color: '#E2E2E6',
    margin: '4px 0',
  },
  textarea: {
    width: '100%',
    height: '120px',
    backgroundColor: '#111318',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '12px',
    padding: '10px',
    color: '#C4E7C4',
    fontFamily: 'monospace',
    fontSize: '11px',
    outline: 'none',
    resize: 'none' as const,
  },
  textareaEditable: {
    width: '100%',
    height: '90px',
    backgroundColor: '#111318',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '12px',
    padding: '10px',
    color: '#E2E2E6',
    fontSize: '12px',
    outline: 'none',
    resize: 'none' as const,
    boxSizing: 'border-box' as const,
  },
  theoryContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  notesDivider: {
    height: '1px',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    margin: '8px 0',
  },
  addNotesBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(168, 199, 250, 0.08)',
    border: '1px dashed rgba(168, 199, 250, 0.3)',
    borderRadius: '12px',
    padding: '10px 16px',
    color: '#A8C7FA',
    fontSize: '12.5px',
    fontWeight: '700' as const,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginTop: '6px',
  },
  doneNotesBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
    backgroundColor: '#0A305F',
    border: 'none',
    borderRadius: '8px',
    padding: '6px 12px',
    color: '#A8C7FA',
    fontSize: '11px',
    fontWeight: '700' as const,
    cursor: 'pointer',
    marginTop: '4px',
  },
  renderedNotesCardInteractive: {
    backgroundColor: '#111318',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    borderRadius: '16px',
    padding: '16px',
    width: '100%',
    boxSizing: 'border-box' as const,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
    transition: 'border-color 0.2s ease',
  },
  cardHeaderEditLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
    paddingBottom: '8px',
    marginBottom: '4px',
  },
  openSourceBadge: {
    flexDirection: 'row' as const,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: 'rgba(168, 199, 250, 0.03)',
    border: '1px dashed rgba(168, 199, 250, 0.15)',
    borderRadius: '16px',
    padding: '14px',
    marginTop: '12px',
  },
  openSourceText: {
    flex: 1,
    fontSize: '11px',
    color: '#8A92A6',
    lineHeight: '16px',
    margin: 0,
  }
} as const;

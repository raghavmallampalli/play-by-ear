'use dom';

import { useCallback, useEffect, useRef, useState } from 'react';
import { pianoSamples } from '../constants/piano_samples';
import { CHORD_DICTIONARY, MELODY_DICTIONARY } from '../levels/labels';
import { PlayedChord, PlayedNote } from '../types/music';
import { NoteConverter } from '../utils/note_converter';

import { AudioEngine, AudioEngineOptions } from '../types/audio';

export function useAudioEngine({ mode, preloadMidi }: AudioEngineOptions): AudioEngine {
  const [isPlaying, setIsPlaying] = useState(false);
  const isPlayingRef = useRef(false);
  const [playheadTime, setPlayheadTime] = useState(0);
  const [activeNotes, setActiveNotes] = useState<number[]>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [hasPlayedCadence, setHasPlayedCadence] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const mainGainRef = useRef<GainNode | null>(null);
  const audioBuffersRef = useRef<Map<number, AudioBuffer>>(new Map());
  const schedulerTimerRef = useRef<any>(null);
  const startTimeoutRef = useRef<any>(null);
  const lastTickTimeRef = useRef<number>(0);
  const nextNoteIndexRef = useRef<number>(0);

  // Refactor: Store flat list of absolute notes for the scheduler to minimize runtime overhead
  const scheduledNotesRef = useRef<{ midi: number, time: number, duration: number, velocity: number }[]>([]);
  const playheadRef = useRef<number>(0);

  useEffect(() => { playheadRef.current = playheadTime; }, [playheadTime]);

  // ─── Audio Context ─────────────────────────────────────────────────────────

  const initAudio = useCallback(async () => {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(1.6, ctx.currentTime);
      gain.connect(ctx.destination);
      audioCtxRef.current = ctx;
      mainGainRef.current = gain;

      preloadMidi.forEach(preloadSample);
      setTimeout(() => {
        Object.keys(pianoSamples).forEach(k => preloadSample(Number(k)));
      }, 1500);

      if (ctx.state === 'suspended') await ctx.resume();
    } else if (audioCtxRef.current.state === 'suspended') {
      await audioCtxRef.current.resume();
    }
  }, [preloadMidi]);

  useEffect(() => {
    initAudio();
    return () => { if (schedulerTimerRef.current) clearInterval(schedulerTimerRef.current); };
  }, [initAudio]);

  const preloadSample = useCallback((midi: number) => {
    if (audioBuffersRef.current.has(midi)) return;
    const asset = pianoSamples[midi];
    if (!asset) return;
    fetch(asset)
      .then(r => r.arrayBuffer())
      .then(ab => audioCtxRef.current?.decodeAudioData(ab))
      .then(buf => { if (buf) audioBuffersRef.current.set(midi, buf); })
      .catch(() => { });
  }, []);

  // ─── Synthesis ─────────────────────────────────────────────────────────────

  const playSynthNote = useCallback((
    ctx: AudioContext,
    midi: number,
    startTime: number,
    duration: number,
    velocity: number,
    showHighlight = true,
  ) => {
    if (!mainGainRef.current) return;

    const buf = audioBuffersRef.current.get(midi);
    if (buf) {
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const vGain = ctx.createGain();
      const vol = velocity * 1.45;
      vGain.gain.setValueAtTime(0, startTime);
      vGain.gain.linearRampToValueAtTime(vol, startTime + 0.005);
      vGain.gain.setValueAtTime(vol, startTime + duration);
      vGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration + 0.8);
      src.connect(vGain).connect(mainGainRef.current);
      src.start(startTime);
      src.stop(startTime + duration + 0.95);
    } else {
      preloadSample(midi);
      const freq = 440 * Math.pow(2, (midi - 69) / 12);
      const osc1 = ctx.createOscillator();
      const vGain = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(freq, startTime);
      const peak = velocity * 0.16;
      vGain.gain.setValueAtTime(0, startTime);
      vGain.gain.linearRampToValueAtTime(peak, startTime + 0.008);
      vGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration + 0.6);
      osc1.connect(vGain).connect(mainGainRef.current);
      osc1.start(startTime);
      osc1.stop(startTime + duration + 0.7);
    }

    if (showHighlight) {
      const triggerMs = Math.max(0, (startTime - ctx.currentTime) * 1000);
      setTimeout(() => setActiveNotes(p => [...p, midi]), triggerMs);
      setTimeout(() => setActiveNotes(p => p.filter(n => n !== midi)), triggerMs + duration * 1000);
    }
  }, [preloadSample]);

  // ─── Scheduler ─────────────────────────────────────────────────────────────

  const runScheduler = useCallback(() => {
    const tStart = performance.now();
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    const lookahead = 0.15;
    const now = ctx.currentTime;
    const elapsed = now - lastTickTimeRef.current;
    lastTickTimeRef.current = now;

    // We keep playhead in seconds for simplicity in the UI
    let newPlayhead = playheadRef.current + elapsed;

    const notes = scheduledNotesRef.current;
    const lastNoteEnd = notes.length > 0 ? Math.max(...notes.map(n => n.time + n.duration)) + 0.5 : 3.0;

    if (newPlayhead >= lastNoteEnd) {

      stopPlayback();
      return;
    }
    setPlayheadTime(newPlayhead);
    playheadRef.current = newPlayhead;

    const scheduleEnd = newPlayhead + lookahead;
    let scheduledCount = 0;
    while (
      nextNoteIndexRef.current < notes.length &&
      notes[nextNoteIndexRef.current].time < scheduleEnd
    ) {
      const note = notes[nextNoteIndexRef.current];
      if (note.time >= playheadRef.current - lookahead) {
        playSynthNote(ctx, note.midi, now + Math.max(0, note.time - playheadRef.current), note.duration, note.velocity, false);
        scheduledCount++;
      }
      nextNoteIndexRef.current++;
    }

    const tEnd = performance.now();
    if (tEnd - tStart > 2) {
      console.warn(`[PROFILE runScheduler] took ${(tEnd - tStart).toFixed(2)}ms to schedule ${scheduledCount} notes. Playhead: ${newPlayhead.toFixed(2)}`);
    }
  }, [playSynthNote]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Playback Control ──────────────────────────────────────────────────────

  const pausePlayback = useCallback(() => {

    if (startTimeoutRef.current) { clearTimeout(startTimeoutRef.current); startTimeoutRef.current = null; }
    if (schedulerTimerRef.current) { clearInterval(schedulerTimerRef.current); schedulerTimerRef.current = null; }
    setIsPlaying(false);
    isPlayingRef.current = false;
  }, []);

  const stopPlayback = useCallback(() => {

    pausePlayback();
    setPlayheadTime(0);
    playheadRef.current = 0;
    setActiveNotes([]);
    nextNoteIndexRef.current = 0;

    if (audioCtxRef.current && mainGainRef.current) {
      const oldGain = mainGainRef.current;
      oldGain.gain.cancelScheduledValues(audioCtxRef.current.currentTime);
      oldGain.gain.setValueAtTime(oldGain.gain.value || 1.6, audioCtxRef.current.currentTime);
      oldGain.gain.linearRampToValueAtTime(0.0001, audioCtxRef.current.currentTime + 0.05);
      setTimeout(() => oldGain.disconnect(), 100);

      const newGain = audioCtxRef.current.createGain();
      newGain.gain.setValueAtTime(1.6, audioCtxRef.current.currentTime);
      newGain.connect(audioCtxRef.current.destination);
      mainGainRef.current = newGain;
    }
  }, [pausePlayback]);

  const startPlayback = useCallback(async (melody: PlayedNote[], chords: PlayedChord[], converter: NoteConverter, skipCadence = false) => {

    await initAudio();
    if (isPlayingRef.current) return;

    // Prepare scheduled notes (convert Relative -> MIDI and Ticks -> Seconds)
    // We deduplicate notes that appear in both melody and chords at the same time to prevent audio phasing
    const uniqueNotes = new Map<string, { midi: number, time: number, duration: number, velocity: number }>();

    // Helper to get a consistent deduplication key (rounding time to nearest ~5ms to handle floating point fuzziness)
    const getNoteKey = (midi: number, time: number) => `${midi}_${Math.round(time * 200)}`;

    chords.forEach(c => {
      c.notes.forEach((n, idx) => {
        const midi = converter.toMidi(n);
        const time = converter.ticksToSeconds(c.beat) + idx * 0.015;
        const key = getNoteKey(midi, time);
        if (!uniqueNotes.has(key)) {
          uniqueNotes.set(key, {
            midi,
            time,
            duration: converter.ticksToSeconds(c.duration),
            velocity: 0.75,
          });
        }
      });
    });

    melody.forEach(n => {
      const midi = converter.toMidi(n.note);
      const time = converter.ticksToSeconds(n.beat);
      const key = getNoteKey(midi, time);
      // Melody velocities take precedence if the note overlaps with a chord
      uniqueNotes.set(key, {
        midi,
        time,
        duration: converter.ticksToSeconds(n.duration),
        velocity: 0.85,
      });
    });

    scheduledNotesRef.current = Array.from(uniqueNotes.values()).sort((a, b) => a.time - b.time);

    setIsPlaying(true);
    isPlayingRef.current = true;
    setHasStarted(true);

    const ctx = audioCtxRef.current!;
    const doStart = () => {

      lastTickTimeRef.current = ctx.currentTime;
      let idx = 0;
      while (idx < scheduledNotesRef.current.length && scheduledNotesRef.current[idx].time < playheadRef.current) idx++;
      nextNoteIndexRef.current = idx;
      schedulerTimerRef.current = setInterval(runScheduler, 25);

    };

    if (playheadRef.current === 0 && !hasPlayedCadence && !skipCadence && mode !== 'midi_player') {

      playGroundingCadenceInternal(ctx, converter);
      setHasPlayedCadence(true);
      startTimeoutRef.current = setTimeout(doStart, 3700);
    } else {

      doStart();
    }
  }, [isPlaying, hasPlayedCadence, runScheduler, initAudio, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Convenience Playback ──────────────────────────────────────────────────

  const playGroundingCadenceInternal = (ctx: AudioContext, converter: NoteConverter) => {
    const playChord = (time: number, notes: { degree: number; offset: number }[]) => {
      notes.forEach((n, i) => {
        const midi = converter.toMidi(n);
        playSynthNote(ctx, midi, ctx.currentTime + time + i * 0.015, 0.7, 0.7);
      });
    };
    playChord(0.0, [{ degree: 0, offset: 0 }, { degree: 4, offset: 0 }, { degree: 7, offset: 0 }]); // I
    playChord(0.8, [{ degree: 0, offset: 0 }, { degree: 5, offset: 0 }, { degree: 9, offset: 0 }]); // IV
    playChord(1.6, [{ degree: 11, offset: -1 }, { degree: 2, offset: 0 }, { degree: 7, offset: 0 }]); // V
    playChord(2.4, [{ degree: 0, offset: 0 }, { degree: 4, offset: 0 }, { degree: 7, offset: 0 }]); // I
  };

  const playGroundingCadence = useCallback((converter: NoteConverter) => {
    stopPlayback();
    initAudio().then(() => {
      const ctx = audioCtxRef.current;
      if (ctx) playGroundingCadenceInternal(ctx, converter);
    });
  }, [initAudio, stopPlayback]); // eslint-disable-line react-hooks/exhaustive-deps

  const playTonicRootChord = useCallback((converter: NoteConverter) => {
    stopPlayback();
    initAudio().then(() => {
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      const now = ctx.currentTime;
      [0, 4, 7, 12].forEach((degreeOffset, i) => {
        // Handle degree 12 as degree 0, offset 1
        const relNote = degreeOffset === 12 ? { degree: 0, offset: 1 } : { degree: degreeOffset, offset: 0 };
        playSynthNote(ctx, converter.toMidi(relNote), now + i * 0.02, 1.8, 0.8);
      });
    });
  }, [initAudio, playSynthNote, stopPlayback]);

  const triggerLiveNote = useCallback((midi: number, showHighlight = true) => {
    initAudio().then(() => {
      const ctx = audioCtxRef.current;
      if (ctx) playSynthNote(ctx, midi, ctx.currentTime, 0.45, 0.95, showHighlight);
    });
  }, [initAudio, playSynthNote]);

  const playChoiceAudio = useCallback((choice: string, converter: NoteConverter, showHighlight = true) => {
    stopPlayback();
    initAudio().then(() => {
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      const now = ctx.currentTime;
      const chord = (relNotes: { degree: number, offset: number }[]) =>
        relNotes.forEach((n, i) => playSynthNote(ctx, converter.toMidi(n), now + i * 0.02, 1.2, 0.7, showHighlight));

      if (MELODY_DICTIONARY[choice]) {
        playSynthNote(ctx, converter.toMidi(MELODY_DICTIONARY[choice]), now, 0.6, 0.85, showHighlight);
      } else if (CHORD_DICTIONARY[choice]) {
        chord(CHORD_DICTIONARY[choice]);
      }
    });
  }, [initAudio, playSynthNote]);

  const playBackingChordsOnly = useCallback((chords: PlayedChord[], converter: NoteConverter) => {
    stopPlayback();
    startPlayback([], chords, converter, true);
  }, [startPlayback, stopPlayback]);

  const playMelodyOnly = useCallback((melody: PlayedNote[], converter: NoteConverter) => {
    stopPlayback();
    startPlayback(melody, [], converter, true);
  }, [startPlayback, stopPlayback]);

  const resetStartFlags = useCallback(() => {
    setHasStarted(false);
    setHasPlayedCadence(false);
  }, []);

  const startDirectMidiPlayback = useCallback((notes: { midi: number; time: number; duration: number; velocity: number }[], speed = 1.0) => {

    initAudio().then(() => {
      if (startTimeoutRef.current) { clearTimeout(startTimeoutRef.current); startTimeoutRef.current = null; }
      if (schedulerTimerRef.current) { clearInterval(schedulerTimerRef.current); schedulerTimerRef.current = null; }

      scheduledNotesRef.current = notes.map(n => ({
        midi: n.midi,
        time: n.time / speed,
        duration: n.duration / speed,
        velocity: n.velocity,
      })).sort((a, b) => a.time - b.time);
  
      nextNoteIndexRef.current = scheduledNotesRef.current.findIndex(n => n.time >= playheadRef.current);
      if (nextNoteIndexRef.current === -1) {
        nextNoteIndexRef.current = scheduledNotesRef.current.length;
      }
  
      setIsPlaying(true);
      isPlayingRef.current = true;
      setHasStarted(true);

      const ctx = audioCtxRef.current!;
      lastTickTimeRef.current = ctx.currentTime;
      schedulerTimerRef.current = setInterval(runScheduler, 25);
  
    });
  }, [initAudio, runScheduler]);

  const seekPlayback = useCallback((time: number) => {
    const wasPlaying = isPlaying;
    if (wasPlaying) {
      pausePlayback();
    }
    setPlayheadTime(time);
    playheadRef.current = time;
    if (wasPlaying) {
      setTimeout(() => {
        initAudio().then(() => {
          setIsPlaying(true);
          isPlayingRef.current = true;
          const ctx = audioCtxRef.current!;
          lastTickTimeRef.current = ctx.currentTime;
          
          let idx = 0;
          while (idx < scheduledNotesRef.current.length && scheduledNotesRef.current[idx].time < playheadRef.current) idx++;
          nextNoteIndexRef.current = idx;
          
          schedulerTimerRef.current = setInterval(runScheduler, 25);
        });
      }, 50);
    }
  }, [isPlaying, pausePlayback, initAudio, runScheduler]);

  return {
    isPlaying, playheadTime, activeNotes, hasStarted, hasPlayedCadence,
    startPlayback, pausePlayback, stopPlayback,
    triggerLiveNote, playChoiceAudio,
    playTonicRootChord, playGroundingCadence,
    playBackingChordsOnly, playMelodyOnly,
    resetStartFlags, setPlayheadTime,
    seekPlayback, startDirectMidiPlayback,
  };
}

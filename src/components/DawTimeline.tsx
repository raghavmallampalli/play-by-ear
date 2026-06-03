'use dom';

import React from 'react';
import { displayLabel } from '../levels/labels';
import { ChordLabelSystem, MelodyLabelSystem } from '../types/labels';
import { TimelineSlot } from '../types/levels';
import { NoteConverter } from '../utils/note_converter';
import { setupHorizontalWheelScroll } from '../utils/scroll_helper';
import { domStyles } from './styles/domStyles';
import { log } from '../utils/logger';

import { isQueuedLevel } from '../levels';

interface MemoizedSlotsProps {
  timelineSlots: TimelineSlot[];
  revealAllLabels: boolean;
  focusedSlotIndex: number | null;
  converter: NoteConverter;
  hasStarted: boolean;
  melodyLabelSystem: MelodyLabelSystem;
  chordLabelSystem: ChordLabelSystem;
  pixelsPerSecond: number;
  onSlotClick: (index: number, slot: TimelineSlot) => void;
}

const MemoizedSlotsInner = ({
  timelineSlots,
  revealAllLabels,
  focusedSlotIndex,
  converter,
  hasStarted,
  melodyLabelSystem,
  chordLabelSystem,
  pixelsPerSecond,
  onSlotClick
}: MemoizedSlotsProps) => {
  return (
    <>
      {timelineSlots.map((slot, index) => {
        const isSolved = slot.answer !== null || revealAllLabels;
        const isFocused = focusedSlotIndex === index && !isSolved && !revealAllLabels;
        const slotTime = converter.ticksToSeconds(slot.beat);

        const slotStyle = (!hasStarted && !revealAllLabels)
          ? domStyles.disabledBtn
          : (isFocused
            ? domStyles.primaryBtn
            : (isSolved
              ? (slot.correct ? domStyles.correctBtn : domStyles.wrongBtn)
              : domStyles.secondaryBtn));

        const displayVal = isSolved
          ? displayLabel(slot.answer || '', melodyLabelSystem, chordLabelSystem, converter.tonicPitchClass)
          : '';

        return (
          <div
            key={index}
            style={{
              ...slotStyle,
              position: 'absolute',
              left: `${54 + slotTime * pixelsPerSecond}px`,
              transform: 'translateX(-50%)',
              height: '32px',
              minWidth: '32px',
              width: 'auto',
              padding: '0 8px',
              borderRadius: '10px',
              zIndex: isFocused ? 110 : 100,
              cursor: (!hasStarted && !revealAllLabels) ? 'default' : 'pointer',
              pointerEvents: (!hasStarted && !revealAllLabels) ? 'none' : 'auto',
            }}
            onClick={() => (hasStarted || revealAllLabels) && onSlotClick(index, slot)}
          >
            {displayVal}
          </div>
        );
      })}
    </>
  );
};

const areSlotsEqual = (prev: MemoizedSlotsProps, next: MemoizedSlotsProps) => {
  return (
    prev.timelineSlots === next.timelineSlots &&
    prev.revealAllLabels === next.revealAllLabels &&
    prev.focusedSlotIndex === next.focusedSlotIndex &&
    prev.converter === next.converter &&
    prev.hasStarted === next.hasStarted &&
    prev.melodyLabelSystem === next.melodyLabelSystem &&
    prev.chordLabelSystem === next.chordLabelSystem &&
    prev.pixelsPerSecond === next.pixelsPerSecond
    // Explicitly ignoring onSlotClick since it's an inline function that triggers unnecessary re-renders
  );
};

const MemoizedSlots = React.memo(MemoizedSlotsInner, areSlotsEqual);

interface DawTimelineProps {
  level: number;
  timelineSlots: TimelineSlot[];
  focusedSlotIndex: number | null;
  playheadTime: number;
  isPlaying: boolean;
  hasStarted: boolean;
  converter: NoteConverter;
  onSlotClick: (index: number, slot: TimelineSlot) => void;
  onPlayPause: () => void;
  melodyLabelSystem?: MelodyLabelSystem;
  chordLabelSystem?: ChordLabelSystem;
  onSeek?: (time: number) => void;
  revealAllLabels?: boolean;
}

const dawStyles = {
  gridOverlay: {
    position: 'absolute' as const,
    top: 0, left: 0, width: '100%', height: '100%',
    pointerEvents: 'none' as const,
  },
  gridLine: {
    position: 'absolute' as const,
    top: 0, height: '100%',
  },
};

export default function DawTimeline({
  level,
  timelineSlots,
  focusedSlotIndex,
  playheadTime,
  isPlaying,
  hasStarted,
  converter,
  onSlotClick,
  onPlayPause,
  melodyLabelSystem = 'carnatic',
  chordLabelSystem = 'roman',
  onSeek,
  revealAllLabels = false,
}: DawTimelineProps) {
  const renderStart = performance.now();

  React.useEffect(() => {
    const renderEnd = performance.now();
    if (renderEnd - renderStart > 2) {
      log.debug(`[PROFILE DawTimeline] Render took ${(renderEnd - renderStart).toFixed(2)}ms (Slots: ${timelineSlots.length}, playhead: ${playheadTime.toFixed(2)})`);
    }
  });

  // Memoize all timeline width and scale calculations
  const { maxDuration, barCount, pixelsPerSecond, tickGridSpacing } = React.useMemo(() => {
    const isQueued = isQueuedLevel(level);
    const lastSlotTime = timelineSlots.length > 0
      ? Math.max(...timelineSlots.map(s => converter.ticksToSeconds(s.beat))) + 2.5
      : 3.0;
    const maxDur = isQueued
      ? lastSlotTime
      : Math.max(lastSlotTime, level === 3 ? 18.0 : (level >= 6 ? 20.0 : (level >= 4 ? 15.0 : 3.0)));
    const bCount = Math.ceil(maxDur);

    const uniqueTimes = Array.from(new Set(timelineSlots.map(s => converter.ticksToSeconds(s.beat)))).sort((a, b) => a - b);
    const diffs: number[] = [];
    for (let i = 1; i < uniqueTimes.length; i++) {
      const diff = uniqueTimes[i] - uniqueTimes[i - 1];
      if (diff > 0.001) {
        diffs.push(diff);
      }
    }
    let medianDiff = 0.5;
    if (diffs.length > 0) {
      const sorted = [...diffs].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      medianDiff = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }
    const minPixelsPerNote = 50;
    const derivedScale = minPixelsPerNote / Math.max(0.01, medianDiff);
    const pPerSecond = Math.min(600, Math.max(120, derivedScale));

    const oneBeatTicks = converter.ticksPerBeat;
    const oneBeatSecs = oneBeatTicks > 0 ? converter.ticksToSeconds(oneBeatTicks) : 0.5;
    const beatWidth = oneBeatSecs * pPerSecond;
    const tGridSpacing = beatWidth / 4;

    return { maxDuration: maxDur, barCount: bCount, pixelsPerSecond: pPerSecond, tickGridSpacing: tGridSpacing };
  }, [level, timelineSlots, converter]);


  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    return setupHorizontalWheelScroll(scrollContainerRef.current);
  }, []);

  React.useEffect(() => {
    if (scrollContainerRef.current && playheadTime > 0) {
      const playheadX = 54 + playheadTime * pixelsPerSecond;
      const containerWidth = scrollContainerRef.current.clientWidth;
      scrollContainerRef.current.scrollLeft = playheadX - containerWidth / 2;
    } else if (scrollContainerRef.current && playheadTime === 0 && isPlaying) {
      scrollContainerRef.current.scrollLeft = 0;
    }
  }, [playheadTime, isPlaying, pixelsPerSecond]);

  React.useEffect(() => {
    if (!isPlaying && scrollContainerRef.current && focusedSlotIndex !== null && timelineSlots[focusedSlotIndex]) {
      const slot = timelineSlots[focusedSlotIndex];
      const slotTime = converter.ticksToSeconds(slot.beat);
      const slotX = 54 + slotTime * pixelsPerSecond;
      const containerWidth = scrollContainerRef.current.clientWidth;

      scrollContainerRef.current.scrollTo({
        left: slotX - containerWidth / 2,
        behavior: 'smooth',
      });
    }
  }, [focusedSlotIndex, timelineSlots, converter, isPlaying, pixelsPerSecond]);

  const [hasOverflow, setHasOverflow] = React.useState(false);

  const checkOverflow = React.useCallback(() => {
    if (scrollContainerRef.current) {
      const { clientWidth } = scrollContainerRef.current;
      if (clientWidth <= 0) return;

      const totalContentWidth = 108 + barCount * pixelsPerSecond;
      setHasOverflow(totalContentWidth > clientWidth);
    }
  }, [barCount, pixelsPerSecond]);

  React.useEffect(() => {
    checkOverflow();
    const timer = setTimeout(checkOverflow, 50);
    return () => clearTimeout(timer);
  }, [checkOverflow]);

  React.useEffect(() => {
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [checkOverflow]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      {/* Scrollable timeline container */}
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        {/* Left fade */}
        {hasOverflow && (
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: '24px',
            background: 'linear-gradient(to right, #1D2024 15%, transparent)',
            pointerEvents: 'none', zIndex: 106,
          }} />
        )}

        <div
          ref={scrollContainerRef}
          className="piano-scroll-frame"
          style={{
            width: '100%',
            height: '66px',
            overflowX: hasOverflow ? 'auto' : 'hidden',
            overflowY: 'hidden',
            backgroundColor: '#111318', borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.03)',
            padding: '7px 0', boxSizing: 'border-box', userSelect: 'none',
            cursor: onSeek ? 'pointer' : 'default',
          }}
          onClick={(e) => {
            if (!onSeek) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left + e.currentTarget.scrollLeft;
            const targetSeconds = (clickX - 54) / pixelsPerSecond;
            onSeek(Math.max(0, Math.min(maxDuration, targetSeconds)));
          }}
        >
          <div style={{
            height: '52px',
            width: `${108 + barCount * pixelsPerSecond}px`,
            position: 'relative', display: 'flex', alignItems: 'center',
          }}>
            {/* Beat grid lines */}
            {React.useMemo(() => (
              <div style={dawStyles.gridOverlay}>
                {Array.from({ length: barCount * 4 + 1 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      ...dawStyles.gridLine,
                      borderLeft: i % 4 === 0
                        ? '1px dashed rgba(255,255,255,0.12)'
                        : '1px dotted rgba(255,255,255,0.04)',
                      left: `${54 + i * tickGridSpacing}px`,
                    }}
                  />
                ))}
              </div>
            ), [barCount, tickGridSpacing])}

            {/* Playhead */}
            {playheadTime > 0 && (
              <div style={{
                position: 'absolute', top: 0, bottom: 0, width: '1.5px',
                backgroundColor: '#A8C7FA', zIndex: 105,
                boxShadow: '0 0 8px rgba(168, 199, 250, 0.4)',
                left: `${54 + playheadTime * pixelsPerSecond}px`,
              }} />
            )}

            {/* Interactive Slots */}
            <MemoizedSlots
              timelineSlots={timelineSlots}
              revealAllLabels={revealAllLabels}
              focusedSlotIndex={focusedSlotIndex}
              converter={converter}
              hasStarted={hasStarted}
              melodyLabelSystem={melodyLabelSystem}
              chordLabelSystem={chordLabelSystem}
              pixelsPerSecond={pixelsPerSecond}
              onSlotClick={onSlotClick}
            />
          </div>
        </div>

        {/* Right fade */}
        {hasOverflow && (
          <div style={{
            position: 'absolute', right: 0, top: 0, bottom: 0, width: '24px',
            background: 'linear-gradient(to left, #1D2024 15%, transparent)',
            pointerEvents: 'none', zIndex: 106,
          }} />
        )}
      </div>

      <div style={{ width: '56px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <button
          disabled={!hasStarted}
          onClick={onPlayPause}
          style={{
            ...(!hasStarted ? domStyles.disabledBtn : (isPlaying ? domStyles.secondaryBtn : domStyles.primaryBtn)),
            width: '100%',
            height: '100%',
          }}
        >
          {isPlaying ? (
            <div style={{ display: 'flex', gap: '4px' }}>
              <div style={{ width: '4px', height: '14px', backgroundColor: '#E2E2E6', borderRadius: '1px' }} />
              <div style={{ width: '4px', height: '14px', backgroundColor: '#E2E2E6', borderRadius: '1px' }} />
            </div>
          ) : (
            <div style={{
              borderLeft: `16px solid ${!hasStarted ? '#8E919A' : '#0A305F'}`,
              borderTop: '10px solid transparent',
              borderBottom: '10px solid transparent',
              width: 0, height: 0,
              opacity: !hasStarted ? 0.6 : 1,
            }} />
          )}
        </button>
      </div>
    </div>
  );
}

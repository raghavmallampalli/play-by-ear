'use dom';

import React from 'react';
import { TimelineSlot } from '../types/levels';
import { NoteConverter } from '../utils/note_converter';
import { domStyles } from './styles/domStyles';
import { setupHorizontalWheelScroll } from '../utils/scroll_helper';

import { isQueuedLevel } from '../levels';

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
}: DawTimelineProps) {
  // Derive timeline width from the last slot's time, falling back to a level default
  const isQueued = isQueuedLevel(level);
  const lastSlotTime = timelineSlots.length > 0 
    ? Math.max(...timelineSlots.map(s => converter.ticksToSeconds(s.beat))) + 2.5 
    : 3.0;
  const maxDuration = isQueued
    ? lastSlotTime
    : Math.max(lastSlotTime, level === 3 ? 18.0 : (level >= 6 ? 20.0 : (level >= 4 ? 15.0 : 3.0)));
  const barCount = Math.ceil(maxDuration);


  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    return setupHorizontalWheelScroll(scrollContainerRef.current);
  }, []);

  React.useEffect(() => {
    if (scrollContainerRef.current && playheadTime > 0) {
      const playheadX = 54 + playheadTime * 120;
      const containerWidth = scrollContainerRef.current.clientWidth;
      scrollContainerRef.current.scrollLeft = playheadX - containerWidth / 2;
    } else if (scrollContainerRef.current && playheadTime === 0 && isPlaying) {
      scrollContainerRef.current.scrollLeft = 0;
    }
  }, [playheadTime, isPlaying]);

  React.useEffect(() => {
    if (!isPlaying && scrollContainerRef.current && focusedSlotIndex !== null && timelineSlots[focusedSlotIndex]) {
      const slot = timelineSlots[focusedSlotIndex];
      const slotTime = converter.ticksToSeconds(slot.beat);
      const slotX = 54 + slotTime * 120;
      const containerWidth = scrollContainerRef.current.clientWidth;
      
      scrollContainerRef.current.scrollTo({
        left: slotX - containerWidth / 2,
        behavior: 'smooth',
      });
    }
  }, [focusedSlotIndex, timelineSlots, converter, isPlaying]);

  const [hasOverflow, setHasOverflow] = React.useState(false);

  const checkOverflow = React.useCallback(() => {
    if (scrollContainerRef.current) {
      const { clientWidth } = scrollContainerRef.current;
      if (clientWidth <= 0) return;

      const lastSlotTime = timelineSlots.length > 0 
        ? Math.max(...timelineSlots.map(s => converter.ticksToSeconds(s.beat)))
        : 0;
      const maxNoteWidth = 54 + lastSlotTime * 120 + 54;
      
      const playheadX = 54 + playheadTime * 120 + 54;
      const isPlayheadOut = playheadX > clientWidth;
      
      const needsOverflow = maxNoteWidth > clientWidth || (playheadTime > 0 && isPlayheadOut);
      
      setHasOverflow(needsOverflow);
    }
  }, [timelineSlots, playheadTime, converter]);

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
          }}
        >
          <div style={{
            height: '52px',
            width: `${108 + barCount * 120}px`,
            position: 'relative', display: 'flex', alignItems: 'center',
          }}>
            {/* Beat grid lines */}
            <div style={dawStyles.gridOverlay}>
              {Array.from({ length: barCount * 4 + 1 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    ...dawStyles.gridLine,
                    borderLeft: i % 4 === 0
                      ? '1px dashed rgba(255,255,255,0.12)'
                      : '1px dotted rgba(255,255,255,0.04)',
                    left: `${54 + i * 30}px`,
                  }}
                />
              ))}
            </div>

            {/* Playhead */}
            {playheadTime > 0 && (
              <div style={{
                position: 'absolute', top: 0, bottom: 0, width: '1.5px',
                backgroundColor: '#A8C7FA', zIndex: 105,
                boxShadow: '0 0 8px rgba(168, 199, 250, 0.4)',
                left: `${54 + playheadTime * 120}px`,
              }} />
            )}

            {/* Interactive Slots */}
            {timelineSlots.map((slot, index) => {
              const isSolved = slot.answer !== null;
              const isFocused = focusedSlotIndex === index && !isSolved;
              const slotTime = converter.ticksToSeconds(slot.beat);

              const slotStyle = !hasStarted
                ? domStyles.disabledBtn
                : (isFocused
                    ? domStyles.primaryBtn
                    : (isSolved
                        ? (slot.correct ? domStyles.correctBtn : domStyles.wrongBtn)
                        : domStyles.secondaryBtn));

              return (
                <div
                  key={index}
                  style={{
                    ...slotStyle,
                    position: 'absolute',
                    left: `${54 + slotTime * 120}px`,
                    transform: 'translateX(-50%)',
                    height: '32px',
                    minWidth: '32px',
                    width: 'auto',
                    padding: '0 8px',
                    borderRadius: '10px',
                    zIndex: isFocused ? 110 : 100,
                    cursor: !hasStarted ? 'default' : 'pointer',
                    pointerEvents: !hasStarted ? 'none' : 'auto',
                  }}
                  onClick={() => hasStarted && onSlotClick(index, slot)}
                >
                  {isSolved ? slot.answer : (index + 1)}
                </div>
              );
            })}
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

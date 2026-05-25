'use dom';

import React from 'react';
import { TimelineSlot } from '../types/levels';
import { NoteConverter } from '../utils/note_converter';
import { domStyles } from './styles/domStyles';

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
    if (scrollContainerRef.current && playheadTime > 0) {
      const playheadX = 54 + playheadTime * 120;
      const containerWidth = scrollContainerRef.current.clientWidth;
      scrollContainerRef.current.scrollLeft = playheadX - containerWidth / 2;
    } else if (scrollContainerRef.current && playheadTime === 0) {
      scrollContainerRef.current.scrollLeft = 0;
    }
  }, [playheadTime]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      {/* Scrollable timeline container */}
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        {/* Left fade */}
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: '24px',
          background: 'linear-gradient(to right, #1D2024 15%, transparent)',
          pointerEvents: 'none', zIndex: 106,
        }} />

        <div
          ref={scrollContainerRef}
          className="piano-scroll-frame"
          style={{
            width: '100%', overflowX: 'auto',
            backgroundColor: '#111318', borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.03)',
            padding: '4px 0', boxSizing: 'border-box', userSelect: 'none',
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
              const isFocused = focusedSlotIndex === index;
              const isSolved = slot.answer !== null;
              const slotTime = converter.ticksToSeconds(slot.beat);

              const slotStyle = isFocused
                ? domStyles.primaryBtn
                : (isSolved ? domStyles.disabledBtn : domStyles.secondaryBtn);

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
                  }}
                  onClick={() => onSlotClick(index, slot)}
                >
                  {isSolved ? slot.answer : (index + 1)}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right fade */}
        <div style={{
          position: 'absolute', right: 0, top: 0, bottom: 0, width: '24px',
          background: 'linear-gradient(to left, #1D2024 15%, transparent)',
          pointerEvents: 'none', zIndex: 106,
        }} />
      </div>

      {hasStarted && (
        <button
          onClick={onPlayPause}
          style={isPlaying ? domStyles.secondaryBtn : domStyles.primaryBtn}
        >
          {isPlaying ? (
            <div style={{ display: 'flex', gap: '4px' }}>
              <div style={{ width: '4px', height: '14px', backgroundColor: '#E2E2E6', borderRadius: '1px' }} />
              <div style={{ width: '4px', height: '14px', backgroundColor: '#E2E2E6', borderRadius: '1px' }} />
            </div>
          ) : (
            <div style={{
              borderLeft: '16px solid #0A305F',
              borderTop: '10px solid transparent',
              borderBottom: '10px solid transparent',
              width: 0, height: 0,
            }} />
          )}
        </button>
      )}
    </div>
  );
}

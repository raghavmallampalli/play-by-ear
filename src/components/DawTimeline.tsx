'use dom';

import React from 'react';
import { TimelineSlot } from '../types/levels';
import { NoteConverter } from '../utils/note_converter';

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
  slot: {
    position: 'absolute' as const,
    width: '32px', height: '32px', borderRadius: '50%',
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    cursor: 'pointer',
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
              const isCorrect = slot.correct;
              const slotTime = converter.ticksToSeconds(slot.beat);

              return (
                <div
                  key={index}
                  style={{
                    ...dawStyles.slot,
                    left: `${54 + slotTime * 120 - 16}px`,
                    backgroundColor: isSolved
                      ? (isCorrect ? '#4CAF50' : '#E57373')
                      : (isFocused ? '#A8C7FA' : '#3C4043'),
                    border: isFocused ? '2px solid white' : 'none',
                    zIndex: isFocused ? 110 : 100,
                  }}
                  onClick={() => onSlotClick(index, slot)}
                >
                  <span style={{ fontSize: '12px', fontWeight: '700', color: isSolved || isFocused ? '#000' : '#9AA0A6' }}>
                    {isSolved ? slot.answer : (index + 1)}
                  </span>
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

      <button
        onClick={onPlayPause}
        style={{
          width: '52px', height: '52px', borderRadius: '12px',
          backgroundColor: isPlaying ? '#E2E2E6' : '#A8C7FA',
          border: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center',
          cursor: 'pointer', flexShrink: 0, transition: 'all 0.1s',
          boxShadow: isPlaying ? 'inset 0 2px 4px rgba(0,0,0,0.2)' : '0 2px 8px rgba(168, 199, 250, 0.3)',
        }}
      >
        {isPlaying ? (
          <div style={{ display: 'flex', gap: '4px' }}>
            <div style={{ width: '4px', height: '14px', backgroundColor: '#111318', borderRadius: '1px' }} />
            <div style={{ width: '4px', height: '14px', backgroundColor: '#111318', borderRadius: '1px' }} />
          </div>
        ) : (
          <div style={{
            borderLeft: '16px solid #111318',
            borderTop: '10px solid transparent',
            borderBottom: '10px solid transparent',
            width: 0, height: 0,
          }} />
        )}
      </button>
    </div>
  );
}

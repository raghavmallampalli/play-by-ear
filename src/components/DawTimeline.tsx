'use dom';

import React from 'react';

interface TimelineSlot {
  midi: number;
  time: number;
  answer: string | null;
  correct: boolean;
  label: string;
}

interface DawTimelineProps {
  level: number;
  timelineSlots: TimelineSlot[];
  focusedSlotIndex: number | null;
  playheadTime: number;
  isPlaying: boolean;
  hasStarted: boolean;
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
  onSlotClick,
  onPlayPause,
}: DawTimelineProps) {
  const maxDuration = level === 3 ? 15.0 : 2.0;
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
                position: 'absolute', top: 0, bottom: 0,
                left: `${54 + playheadTime * 120}px`,
                width: '2px', backgroundColor: '#E88AB8',
                boxShadow: '0 0 6px #E88AB8', zIndex: 104, pointerEvents: 'none',
              }} />
            )}

            {/* Mystery slots */}
            {timelineSlots.map((slot, index) => {
              const isFocused = focusedSlotIndex === index;
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
                    ...dawStyles.slot,
                    left: `${54 + slot.time * 120}px`,
                    transform: 'translateX(-50%)',
                    backgroundColor: slotColor,
                    border,
                    boxShadow: isFocused ? '0 0 8px rgba(168, 199, 250, 0.3)' : 'none',
                    zIndex: isFocused ? 103 : 102,
                  }}
                  onClick={() => onSlotClick(index, slot)}
                >
                  <span style={{ fontSize: '11px', fontWeight: 950, color: '#E2E2E6' }}>
                    {slot.answer !== null ? slot.answer : '?'}
                  </span>
                </button>
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

      {/* Play/Pause button (only after started) */}
      {hasStarted && (
        <button
          style={{
            width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
            backgroundColor: isPlaying ? 'rgba(255,255,255,0.06)' : '#A8C7FA',
            color: isPlaying ? '#E2E2E6' : '#0A305F',
            border: isPlaying ? '1px solid rgba(255,255,255,0.1)' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: isPlaying ? 'none' : '0 2px 6px rgba(168, 199, 250, 0.25)',
            transition: 'all 0.15s ease',
          }}
          onClick={onPlayPause}
        >
          {isPlaying ? (
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="3" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ marginLeft: '2px' }}>
              <polygon points="6 4 20 12 6 20 6 4" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}

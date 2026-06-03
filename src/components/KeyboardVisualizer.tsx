'use dom';

import React, { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { setupHorizontalWheelScroll } from '../utils/scroll_helper';

interface KeyboardVisualizerProps {
  activeNotes: number[];
  onNoteClick: (midi: number) => void;
  firstNoteMidi?: number;
  baseOctaveMidi?: number;
  tonicScrollTrigger?: number;
}

const isNoteBlack = (midi: number) => [1, 3, 6, 8, 10].includes(midi % 12);

const whiteKeys: number[] = [];
const blackKeysData: { midi: number; rightOfIndex: number }[] = [];

for (let m = 21; m <= 108; m++) {
  if (!isNoteBlack(m)) whiteKeys.push(m);
}
for (let m = 21; m <= 108; m++) {
  if (isNoteBlack(m)) {
    const leftWhiteIndex = whiteKeys.indexOf(m - 1);
    if (leftWhiteIndex !== -1) {
      blackKeysData.push({ midi: m, rightOfIndex: leftWhiteIndex });
    }
  }
}

const octaveColors: Record<number, string> = {
  0: '#7C8BFC',
  1: '#7C8BFC',
  2: '#6ED0C2',
  3: '#84D495',
  4: '#E5C275',
  5: '#E88AB8',
  6: '#EC8787',
  7: '#EC8787',
  8: '#EC8787',
};

export default function KeyboardVisualizer({
  activeNotes,
  onNoteClick,
  firstNoteMidi,
  baseOctaveMidi,
  tonicScrollTrigger,
}: KeyboardVisualizerProps) {
  const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);
  const [containerWidth, setContainerWidth] = useState(484);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wheelCleanupRef = useRef<(() => void) | undefined>(undefined);

  const [showPopout, setShowPopout] = useState(false);
  const [scrollOctave, setScrollOctave] = useState<number | null>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollListenerRef = useRef<(() => void) | undefined>(undefined);

  const keysCount = isLandscape ? 14 : 8.4;
  const keyAreaWidth = Math.max(200, containerWidth - 8);
  const whiteKeyWidth = Math.floor(keyAreaWidth / keysCount);
  const keyboardRowWidth = 52 * whiteKeyWidth;
  const keyboardHeight = isLandscape ? '115px' : '160px';
  const blackKeyHeight = isLandscape ? '70px' : '100px';

  useEffect(() => {
    const handleResize = () => setIsLandscape(window.innerWidth > window.innerHeight);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const scrollRefCallback = useCallback(
    (node: HTMLDivElement | null) => {
      if (wheelCleanupRef.current) {
        wheelCleanupRef.current();
        wheelCleanupRef.current = undefined;
      }
      if (scrollListenerRef.current) {
        scrollListenerRef.current();
        scrollListenerRef.current = undefined;
      }
      scrollRef.current = node;
      if (node) {
        wheelCleanupRef.current = setupHorizontalWheelScroll(node);

        const onScroll = () => {
          const scrollLeft = node.scrollLeft;
          if (whiteKeyWidth > 0) {
            const whiteKeyIdx = Math.max(
              0,
              Math.min(whiteKeys.length - 1, Math.round(scrollLeft / whiteKeyWidth)),
            );
            const leftmostMidi = whiteKeys[whiteKeyIdx];
            const oct = Math.floor(leftmostMidi / 12) - 1;
            const displayOctave = oct + 1;

            setScrollOctave(displayOctave);
            setShowPopout(true);

            if (scrollTimeoutRef.current) {
              clearTimeout(scrollTimeoutRef.current);
            }
            scrollTimeoutRef.current = setTimeout(() => {
              setShowPopout(false);
            }, 700);
          }
        };

        node.addEventListener('scroll', onScroll, { passive: true });
        scrollListenerRef.current = () => {
          node.removeEventListener('scroll', onScroll);
        };
      }
    },
    [whiteKeyWidth],
  );

  const hasCenteredOnMount = useRef(false);
  useLayoutEffect(() => {
    if (scrollRef.current && baseOctaveMidi && whiteKeyWidth > 0 && !hasCenteredOnMount.current) {
      const isBlack = (m: number) => [1, 3, 6, 8, 10].includes(m % 12);
      let keyToScroll = baseOctaveMidi;
      if (isBlack(keyToScroll)) {
        keyToScroll -= 1;
      }
      const whiteKeyIdx = whiteKeys.indexOf(keyToScroll);
      if (whiteKeyIdx !== -1) {
        const targetScroll = Math.max(0, Math.floor((whiteKeyIdx - 1) * whiteKeyWidth));
        scrollRef.current.scrollLeft = targetScroll;
        if (containerWidth !== 484) {
          hasCenteredOnMount.current = true;
        }
      }
    }
  }, [baseOctaveMidi, whiteKeyWidth, containerWidth]);

  useEffect(() => {
    return () => {
      if (wheelCleanupRef.current) {
        wheelCleanupRef.current();
      }
      if (scrollListenerRef.current) {
        scrollListenerRef.current();
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const centerOnTonic = useCallback(
    (smooth = false) => {
      if (scrollRef.current && baseOctaveMidi && whiteKeyWidth > 0) {
        const isBlack = (m: number) => [1, 3, 6, 8, 10].includes(m % 12);
        let keyToScroll = baseOctaveMidi;
        if (isBlack(keyToScroll)) {
          keyToScroll -= 1;
        }
        const whiteKeyIdx = whiteKeys.indexOf(keyToScroll);
        if (whiteKeyIdx !== -1) {
          const targetScroll = Math.max(0, Math.floor((whiteKeyIdx - 1) * whiteKeyWidth));
          if (smooth) {
            scrollRef.current.scrollTo({
              left: targetScroll,
              behavior: 'smooth',
            });
          } else {
            scrollRef.current.scrollLeft = targetScroll;
          }
        }
      }
    },
    [baseOctaveMidi, whiteKeyWidth],
  );

  // 2. Fire centering logic smoothly on tonic or start/restart button clicks
  useEffect(() => {
    if (tonicScrollTrigger && tonicScrollTrigger > 0) {
      centerOnTonic(true);
    }
  }, [tonicScrollTrigger, centerOnTonic]);

  const getKeyHighlight = (midi: number) => {
    if (!activeNotes.includes(midi)) return null;
    const oct = Math.floor(midi / 12) - 1;
    return octaveColors[oct] || '#A8C7FA';
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Left fade */}
      <div
        style={{
          position: 'absolute',
          left: '1px',
          top: '1px',
          bottom: '1px',
          width: '28px',
          background: 'linear-gradient(to right, #111318 10%, transparent)',
          pointerEvents: 'none',
          zIndex: 105,
          borderRadius: '16px 0 0 16px',
        }}
      />

      <div
        ref={scrollRefCallback}
        className="piano-scroll-frame"
        style={{
          width: '100%',
          height: keyboardHeight,
          backgroundColor: '#111318',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.04)',
          overflowX: 'auto',
          padding: '4px',
          boxSizing: 'border-box',
          userSelect: 'none',
        }}
      >
        <div
          style={{ height: '100%', position: 'relative', display: 'flex', width: keyboardRowWidth }}
        >
          {/* White Keys */}
          {whiteKeys.map((midi, index) => {
            const highlightColor = getKeyHighlight(midi);
            return (
              <div
                key={midi}
                style={{
                  height: '100%',
                  width: whiteKeyWidth,
                  backgroundColor: highlightColor || '#E2E2E6',
                  borderRight: '1px solid #1D2024',
                  borderBottom: '1px solid #1D2024',
                  borderRadius: '0 0 5px 5px',
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                  boxShadow: highlightColor ? `inset 0 -20px 0 ${highlightColor}` : 'none',
                  borderLeft: index === 0 ? '1px solid #1D2024' : 'none',
                }}
                onClick={() => onNoteClick(midi)}
              />
            );
          })}

          {/* Black Keys */}
          {blackKeysData.map(({ midi, rightOfIndex }) => {
            const highlightColor = getKeyHighlight(midi);
            const blackKeyWidth = Math.floor(whiteKeyWidth * 0.58);
            const clickTargetWidth = Math.floor(whiteKeyWidth * 0.85);
            const leftPos = (rightOfIndex + 1) * whiteKeyWidth - clickTargetWidth / 2;

            return (
              <div
                key={midi}
                style={{
                  position: 'absolute',
                  top: '0px',
                  left: leftPos,
                  width: clickTargetWidth,
                  height: blackKeyHeight,
                  zIndex: 100,
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'center',
                  backgroundColor: 'transparent',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onNoteClick(midi);
                }}
              >
                <div
                  style={{
                    position: 'relative',
                    left: 'auto',
                    width: blackKeyWidth,
                    height: '100%',
                    backgroundColor: highlightColor || '#14171E',
                    border: highlightColor ? `1.5px solid ${highlightColor}` : '1px solid #000',
                    boxShadow: highlightColor
                      ? `0 0 8px ${highlightColor}`
                      : '0 3px 5px rgba(0,0,0,0.5)',
                    borderRadius: '0 0 4px 4px',
                    zIndex: 100,
                    cursor: 'pointer',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Right fade */}
      <div
        style={{
          position: 'absolute',
          right: '1px',
          top: '1px',
          bottom: '1px',
          width: '28px',
          background: 'linear-gradient(to left, #111318 10%, transparent)',
          pointerEvents: 'none',
          zIndex: 105,
          borderRadius: '0 16px 16px 0',
        }}
      />

      {/* Popout bubble for scroll octave */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '72px',
          height: '72px',
          borderRadius: '20px',
          backgroundColor: 'rgba(17, 19, 24, 0.92)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1.5px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: showPopout ? 1 : 0,
          pointerEvents: 'none',
          zIndex: 1000,
          boxShadow: '0 12px 28px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          transition:
            'opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1), transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: `translate(-50%, -50%) ${showPopout ? 'scale(1)' : 'scale(0.8)'}`,
        }}
      >
        <span
          style={{
            fontSize: '9px',
            fontWeight: '800',
            color: '#8A92A6',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: '2px',
          }}
        >
          Octave
        </span>
        <span
          style={{
            fontSize: '28px',
            fontWeight: '900',
            color: scrollOctave !== null ? octaveColors[scrollOctave - 1] || '#E2E2E6' : '#E2E2E6',
            textShadow:
              scrollOctave !== null ? `0 0 12px ${octaveColors[scrollOctave - 1]}80` : 'none',
            lineHeight: 1,
          }}
        >
          {scrollOctave}
        </span>
      </div>
    </div>
  );
}

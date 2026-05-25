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
const blackKeysData: Array<{ midi: number; rightOfIndex: number }> = [];

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
  8: '#EC8787'
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

  const scrollRefCallback = useCallback((node: HTMLDivElement | null) => {
    if (wheelCleanupRef.current) {
      wheelCleanupRef.current();
      wheelCleanupRef.current = undefined;
    }
    scrollRef.current = node;
    if (node) {
      wheelCleanupRef.current = setupHorizontalWheelScroll(node);
    }
  }, []);

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
    };
  }, []);



  const centerOnTonic = (smooth = false) => {
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
  };

  // 2. Fire centering logic smoothly on tonic or start/restart button clicks
  useEffect(() => {
    if (tonicScrollTrigger && tonicScrollTrigger > 0) {
      centerOnTonic(true);
    }
  }, [tonicScrollTrigger]);



  const getKeyHighlight = (midi: number) => {
    if (!activeNotes.includes(midi)) return null;
    const oct = Math.floor(midi / 12) - 1;
    return octaveColors[oct] || '#A8C7FA';
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Left fade */}
      <div style={{
        position: 'absolute', left: '1px', top: '1px', bottom: '1px', width: '28px',
        background: 'linear-gradient(to right, #111318 10%, transparent)',
        pointerEvents: 'none', zIndex: 105, borderRadius: '16px 0 0 16px'
      }} />

      <div
        ref={scrollRefCallback}
        className="piano-scroll-frame"
        style={{
          width: '100%', height: keyboardHeight, backgroundColor: '#111318',
          borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.04)',
          overflowX: 'auto', padding: '4px', boxSizing: 'border-box', userSelect: 'none',
        }}
      >
        <div style={{ height: '100%', position: 'relative', display: 'flex', width: keyboardRowWidth }}>
          {/* White Keys */}
          {whiteKeys.map((midi, index) => {
            const highlightColor = getKeyHighlight(midi);
            return (
              <div
                key={midi}
                style={{
                  height: '100%', width: whiteKeyWidth,
                  backgroundColor: highlightColor || '#E2E2E6',
                  borderRight: '1px solid #1D2024', borderBottom: '1px solid #1D2024',
                  borderRadius: '0 0 5px 5px', cursor: 'pointer',
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
            const leftPos = (rightOfIndex + 1) * whiteKeyWidth - (clickTargetWidth / 2);

            return (
              <div
                key={midi}
                style={{
                  position: 'absolute', top: '0px', left: leftPos,
                  width: clickTargetWidth, height: blackKeyHeight,
                  zIndex: 100, cursor: 'pointer',
                  display: 'flex', justifyContent: 'center',
                  backgroundColor: 'transparent',
                }}
                onClick={(e) => { e.stopPropagation(); onNoteClick(midi); }}
              >
                <div style={{
                  position: 'relative', left: 'auto',
                  width: blackKeyWidth, height: '100%',
                  backgroundColor: highlightColor || '#14171E',
                  border: highlightColor ? `1.5px solid ${highlightColor}` : '1px solid #000',
                  boxShadow: highlightColor ? `0 0 8px ${highlightColor}` : '0 3px 5px rgba(0,0,0,0.5)',
                  borderRadius: '0 0 4px 4px', zIndex: 100, cursor: 'pointer',
                  boxSizing: 'border-box',
                }} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Right fade */}
      <div style={{
        position: 'absolute', right: '1px', top: '1px', bottom: '1px', width: '28px',
        background: 'linear-gradient(to left, #111318 10%, transparent)',
        pointerEvents: 'none', zIndex: 105, borderRadius: '0 16px 16px 0'
      }} />
    </div>
  );
}

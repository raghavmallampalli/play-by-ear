'use dom';

import React, { useState } from 'react';
import { marked } from 'marked';
import { EXERCISE_TO_THEORY_MAP, THEORY_REGISTRY } from '../theory/theory_registry';

const EXERCISE_HASHES: Record<number, string> = {
  1: '8f3a9e2b',
  2: '5c4a7e9d',
  3: '3b8d6f1a',
};

const IconInfo = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#A8C7FA', flexShrink: 0 }}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const renderMarkdown = (text: string) => {
  if (!text) return null;
  try {
    const rawHtml = marked.parse(text);
    return (
      <div className="markdown-body" style={{ width: '100%' }}>
        <style dangerouslySetInnerHTML={{
          __html: `
          .markdown-body h1, .markdown-body h2, .markdown-body h3 {
            font-size: 17px; font-weight: 800; color: #E2E2E6; margin: 16px 0 8px 0; line-height: 1.3;
          }
          .markdown-body h4, .markdown-body h5 {
            font-size: 14px; font-weight: 700; color: #A8C7FA; margin: 12px 0 6px 0; line-height: 1.3;
          }
          .markdown-body p { font-size: 12.5px; color: #C2C7CF; margin: 0 0 10px 0; line-height: 1.5; }
          .markdown-body ul, .markdown-body ol { margin: 0 0 12px 20px; padding: 0; }
          .markdown-body li { font-size: 12.5px; color: #C2C7CF; margin-bottom: 4px; line-height: 1.5; list-style-type: disc; }
          .markdown-body blockquote {
            border-left: 3px solid #A8C7FA; padding-left: 12px; margin: 12px 0;
            color: #8A92A6; font-style: italic; font-size: 12.5px;
          }
          .markdown-body code {
            background-color: rgba(255,255,255,0.06); padding: 2px 4px; border-radius: 4px;
            font-family: monospace; font-size: 11.5px; color: #A8C7FA;
          }
          .markdown-body strong { color: #E2E2E6; font-weight: 700; }
          .markdown-body em { color: #E2E2E6; font-style: italic; }
        `}} />
        <div dangerouslySetInnerHTML={{ __html: rawHtml }} />
      </div>
    );
  } catch (e) {
    return <div style={{ whiteSpace: 'pre-wrap', fontSize: '12.5px', color: '#C2C7CF' }}>{text}</div>;
  }
};

interface TheoryTabProps {
  level: number;
  userNotes: string;
  onSaveNotes: (val: string) => void;
}

export default function TheoryTab({ level, userNotes, onSaveNotes }: TheoryTabProps) {
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  const getCurrentLevelTheory = () => {
    const exerciseHash = EXERCISE_HASHES[level];
    const theoryHash = exerciseHash ? EXERCISE_TO_THEORY_MAP[exerciseHash] : undefined;
    return (theoryHash ? THEORY_REGISTRY[theoryHash] : null)
      || '### Under Construction\n\nThere is no theory guide mapped for this level yet.';
  };

  return (
    <div style={{
      backgroundColor: '#1D2024', border: '1px solid rgba(255, 255, 255, 0.04)',
      borderRadius: '24px', padding: '18px',
      display: 'flex', flexDirection: 'column', gap: '12px',
    }}>
      {/* Theory content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {renderMarkdown(getCurrentLevelTheory())}
      </div>

      <div style={{ height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.04)', margin: '8px 0' }} />

      {/* User notes section */}
      {!isEditingNotes && userNotes.trim().length === 0 ? (
        <button
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            alignSelf: 'flex-start', backgroundColor: 'rgba(168, 199, 250, 0.08)',
            border: '1px dashed rgba(168, 199, 250, 0.3)', borderRadius: '12px',
            padding: '10px 16px', color: '#A8C7FA', fontSize: '12.5px',
            fontWeight: 700, cursor: 'pointer', marginTop: '6px',
          }}
          onClick={() => setIsEditingNotes(true)}
        >
          <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          Add Notes
        </button>
      ) : isEditingNotes ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
          <textarea
            autoFocus
            placeholder="Type your notes or memory tricks here using standard markdown..."
            value={userNotes}
            onChange={(e) => onSaveNotes(e.target.value)}
            onBlur={() => setIsEditingNotes(false)}
            style={{
              width: '100%', height: '90px', backgroundColor: '#111318',
              border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px',
              padding: '10px', color: '#E2E2E6', fontSize: '12px',
              outline: 'none', resize: 'none', boxSizing: 'border-box',
            }}
          />
          <button
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              alignSelf: 'flex-end', backgroundColor: '#0A305F', border: 'none',
              borderRadius: '8px', padding: '6px 12px', color: '#A8C7FA',
              fontSize: '11px', fontWeight: 700, cursor: 'pointer', marginTop: '4px',
            }}
            onClick={() => setIsEditingNotes(false)}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '5px' }}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Done Editing
          </button>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: '#111318', border: '1px solid rgba(255, 255, 255, 0.04)',
            borderRadius: '16px', padding: '16px', width: '100%',
            boxSizing: 'border-box', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', gap: '10px',
          }}
          onClick={() => setIsEditingNotes(true)}
          title="Click to edit notes"
        >
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
            paddingBottom: '8px', marginBottom: '4px',
          }}>
            <span style={{ fontSize: '11px', color: '#8A92A6', fontWeight: 700 }}>YOUR NOTES</span>
            <span style={{ fontSize: '10px', color: '#A8C7FA', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
              <svg viewBox="0 0 24 24" width="11" height="11" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              CLICK TO EDIT
            </span>
          </div>
          {renderMarkdown(userNotes)}
        </div>
      )}

      {/* Open-source badge */}
      <div style={{
        flexDirection: 'row', display: 'flex', alignItems: 'center', gap: '12px',
        backgroundColor: 'rgba(168, 199, 250, 0.03)',
        border: '1px dashed rgba(168, 199, 250, 0.15)',
        borderRadius: '16px', padding: '14px', marginTop: '12px',
      }}>
        <IconInfo />
        <p style={{ flex: 1, fontSize: '11px', color: '#8A92A6', lineHeight: '16px', margin: 0 }}>
          <strong>Open Source relative pitch trainer.</strong> We welcome you to improve this theory guide or notes! Copy/edit this markdown and submit a PR to our repository.
        </p>
      </div>
    </div>
  );
}

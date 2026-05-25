'use dom';

import { marked } from 'marked';
import React, { useState } from 'react';
import { EXERCISE_HASHES } from '../constants/exercises';
import { EXERCISE_TO_THEORY_MAP } from '../theory/theory_registry';
import { getRepoEditUrl } from '../constants/links';
import { domStyles } from './styles/domStyles';

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

const getGuideFilePath = (level: number): string => {
  const hash = EXERCISE_HASHES[level];
  switch (hash) {
    case 'lvl1_do_re_mi_fa':
    case 'lvl2_sol_la_ti_do':
      return 'src/theory/guides/guide_scale_degrees.md';
    case 'lvl3_hb_melody':
      return 'src/theory/guides/guide_melody_dictation.md';
    case 'lvl4_chord_i_iv_v':
      return 'src/theory/guides/guide_chords_i_iv_v.md';
    case 'lvl5_chord_melody':
      return 'src/theory/guides/guide_chords_melody.md';
    case 'lvl6_hb_chords':
      return 'src/theory/guides/guide_hb_chords.md';
    default:
      return 'src/theory/theory_registry.ts';
  }
};

export default function TheoryTab({ level, userNotes, onSaveNotes }: TheoryTabProps) {
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [copied, setCopied] = useState(false);

  const getCurrentLevelTheory = () => {
    const exerciseHash = EXERCISE_HASHES[level];
    return (exerciseHash ? EXERCISE_TO_THEORY_MAP[exerciseHash] : null)
      || '### Under Construction\n\nThere is no theory guide mapped for this level yet.';
  };

  const handleCopyNotes = () => {
    const textToCopy = userNotes?.trim() || '';
    if (!textToCopy) {
      alert('Your notes are currently empty. Type some notes first before copying!');
      return;
    }
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      alert('Could not copy notes. Please select and copy them manually.');
    });
  };

  return (
    <div style={domStyles.card}>
      {/* Theory content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {renderMarkdown(getCurrentLevelTheory())}
      </div>

      <div style={domStyles.notesDivider} />

      {/* User notes section */}
      {!isEditingNotes && (userNotes?.trim() ?? '').length === 0 ? (
        <button
          style={domStyles.dashedBtn}
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
            style={domStyles.theoryNotesTextarea}
          />
          <button
            style={domStyles.primaryBtn}
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
          style={domStyles.theoryNotesCard}
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
      <div style={domStyles.openSourceBadge}>
        <IconInfo />
        <p style={{ flex: 1, fontSize: '11px', color: '#8A92A6', lineHeight: '16px', margin: 0 }}>
          <strong>Open Source relative pitch trainer.</strong> We welcome you to improve this theory guide!{' '}
          <span 
            onClick={(e) => {
              e.stopPropagation();
              handleCopyNotes();
            }} 
            style={{ 
              color: '#A8C7FA', 
              textDecoration: 'underline', 
              cursor: 'pointer',
              fontWeight: 700 
            }}
          >
            {copied ? 'Copied!' : 'Copy'}
          </span>{' '}
          your notes and submit a PR to{' '}
          <a 
            href={getRepoEditUrl(getGuideFilePath(level))} 
            target="_blank" 
            rel="noopener noreferrer" 
            onClick={(e) => e.stopPropagation()}
            style={{ 
              color: '#A8C7FA', 
              textDecoration: 'underline',
              fontWeight: 700
            }}
          >
            the repository
          </a>.
        </p>
      </div>
    </div>
  );
}

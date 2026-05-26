'use dom';

import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { domStyles } from '../styles/domStyles';

export const IconTuningFork = () => (
  <Ionicons name="ear" size={16} color="currentColor" style={domStyles.iconSpacingRight} />
);

export const IconPlay = () => (
  <Ionicons name="play" size={16} color="currentColor" style={domStyles.iconSpacingRight} />
);

export const IconPause = () => (
  <Ionicons name="pause" size={16} color="currentColor" style={domStyles.iconSpacingRight} />
);

export const IconKeyboard = () => (
  <Ionicons name="keypad" size={16} color="currentColor" style={domStyles.iconSpacingRight} />
);

export const IconMelody = () => (
  <Ionicons name="musical-note" size={16} color="currentColor" style={domStyles.iconSpacingRight} />
);

export const IconRestart = () => (
  <Ionicons name="refresh" size={14} color="currentColor" style={domStyles.iconSpacingRightSmall} />
);

export const IconInfo = () => (
  <Ionicons name="information-circle" size={20} color="#A8C7FA" style={{ flexShrink: 0 }} />
);

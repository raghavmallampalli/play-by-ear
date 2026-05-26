'use dom';

import { MaterialCommunityIcons as MaterialDesignIcons } from '@expo/vector-icons';
import React from 'react';
import { domStyles } from '../styles/domStyles';

// TODO: Find a better icon for tuning fork: or make one using SVG
export const IconTuningFork = () => (
  <MaterialDesignIcons name="anchor" size={16} color="currentColor" style={domStyles.iconSpacingRight} />
);

export const IconPlay = () => (
  <MaterialDesignIcons name="play" size={16} color="currentColor" style={domStyles.iconSpacingRight} />
);

export const IconPause = () => (
  <MaterialDesignIcons name="pause" size={16} color="currentColor" style={domStyles.iconSpacingRight} />
);

export const IconKeyboard = () => (
  <MaterialDesignIcons name="music-clef-bass" size={16} color="currentColor" style={domStyles.iconSpacingRight} />
);

export const IconMelody = () => (
  <MaterialDesignIcons name="music-clef-treble" size={16} color="currentColor" style={domStyles.iconSpacingRight} />
);

export const IconRestart = () => (
  <MaterialDesignIcons name="refresh" size={14} color="currentColor" style={domStyles.iconSpacingRightSmall} />
);

export const IconInfo = () => (
  <MaterialDesignIcons name="information" size={20} color="#A8C7FA" style={{ flexShrink: 0 }} />
);

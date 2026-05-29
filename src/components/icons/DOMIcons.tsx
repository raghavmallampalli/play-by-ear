import { MaterialCommunityIcons as MaterialDesignIcons } from '@expo/vector-icons';
import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
  style?: any;
}

export const IconTuningFork = ({ size = 16, color = 'currentColor', style }: IconProps) => (
  <MaterialDesignIcons name="anchor" size={size} color={color} style={style} />
);

export const IconPlay = ({ size = 16, color = 'currentColor', style }: IconProps) => (
  <MaterialDesignIcons name="play" size={size} color={color} style={style} />
);

export const IconPause = ({ size = 16, color = 'currentColor', style }: IconProps) => (
  <MaterialDesignIcons name="pause" size={size} color={color} style={style} />
);

export const IconKeyboard = ({ size = 16, color = 'currentColor', style }: IconProps) => (
  <MaterialDesignIcons name="music-clef-bass" size={size} color={color} style={style} />
);

export const IconMelody = ({ size = 16, color = 'currentColor', style }: IconProps) => (
  <MaterialDesignIcons name="music-clef-treble" size={size} color={color} style={style} />
);

export const IconRestart = ({ size = 14, color = 'currentColor', style }: IconProps) => (
  <MaterialDesignIcons name="refresh" size={size} color={color} style={style} />
);

export const IconInfo = ({ size = 20, color = '#A8C7FA', style }: IconProps) => (
  <MaterialDesignIcons name="information" size={size} color={color} style={style} />
);

export const IconInfoOutline = ({ size = 20, color = '#A8C7FA', style }: IconProps) => (
  <MaterialDesignIcons name="information-outline" size={size} color={color} style={style} />
);

export const IconPencil = ({ size = 11, color = 'currentColor', style }: IconProps) => (
  <MaterialDesignIcons name="pencil" size={size} color={color} style={style} />
);

export const IconPiano = ({ size = 14, color = 'currentColor', style }: IconProps) => (
  <MaterialDesignIcons name="piano" size={size} color={color} style={style} />
);

export const IconGuitar = ({ size = 14, color = 'currentColor', style }: IconProps) => (
  <MaterialDesignIcons name="guitar-acoustic" size={size} color={color} style={style} />
);

export const IconCheck = ({ size = 12, color = 'currentColor', style }: IconProps) => (
  <MaterialDesignIcons name="check" size={size} color={color} style={style} />
);

export const IconClose = ({ size = 12, color = 'currentColor', style }: IconProps) => (
  <MaterialDesignIcons name="close" size={size} color={color} style={style} />
);

export const IconArrowRight = ({ size = 16, color = 'currentColor', style }: IconProps) => (
  <MaterialDesignIcons name="arrow-right" size={size} color={color} style={style} />
);

export const IconBookOpen = ({ size = 22, color = 'currentColor', style }: IconProps) => (
  <MaterialDesignIcons name="book-open" size={size} color={color} style={style} />
);

export const IconCog = ({ size = 22, color = 'currentColor', style }: IconProps) => (
  <MaterialDesignIcons name="cog" size={size} color={color} style={style} />
);

export const IconAlert = ({ size = 28, color = 'currentColor', style }: IconProps) => (
  <MaterialDesignIcons name="alert" size={size} color={color} style={style} />
);

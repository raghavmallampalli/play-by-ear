import { MaterialCommunityIcons as MaterialDesignIcons } from '@expo/vector-icons';
import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
  style?: any;
}

export const IconArrowLeft = ({ size = 18, color = '#C2C7CF', style }: IconProps) => (
  <MaterialDesignIcons name="arrow-left" size={size} color={color} style={style} />
);

export const IconPiano = ({ size = 36, color = '#0A305F', style }: IconProps) => (
  <MaterialDesignIcons name="piano" size={size} color={color} style={style} />
);

export const IconWrench = ({ size = 36, color = '#53565F', style }: IconProps) => (
  <MaterialDesignIcons name="wrench" size={size} color={color} style={style} />
);

export const IconLock = ({ size = 18, color = '#C2C7CF', style }: IconProps) => (
  <MaterialDesignIcons name="lock" size={size} color={color} style={style} />
);

export const IconAlert = ({ size = 28, color = '#E9A117', style }: IconProps) => (
  <MaterialDesignIcons name="alert" size={size} color={color} style={style} />
);

export const IconCog = ({ size = 36, color = '#A8C7FA', style }: IconProps) => (
  <MaterialDesignIcons name="cog" size={size} color={color} style={style} />
);

export const IconPlay = ({ size = 10, color = '#0A305F', style }: IconProps) => (
  <MaterialDesignIcons name="play" size={size} color={color} style={style} />
);

export const IconBookOpen = ({ size = 16, color = 'currentColor', style }: IconProps) => (
  <MaterialDesignIcons name="book-open" size={size} color={color} style={style} />
);

export const IconMusic = ({ size = 36, color = '#A8C7FA', style }: IconProps) => (
  <MaterialDesignIcons name="music" size={size} color={color} style={style} />
);

export const IconFolder = ({ size = 20, color = 'currentColor', style }: IconProps) => (
  <MaterialDesignIcons name="folder" size={size} color={color} style={style} />
);

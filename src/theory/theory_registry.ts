import guideChordsIIvV from './guides/guide_chords_i_iv_v.md';
import guideChordsMelody from './guides/guide_chords_melody.md';
import guideHbChords from './guides/guide_hb_chords.md';
import guideMelodyDictation from './guides/guide_melody_dictation.md';
import guideScaleDegrees from './guides/guide_scale_degrees.md';

export const EXERCISE_TO_THEORY_MAP: Record<string, string> = {
  do_re_mi_fa: guideScaleDegrees,
  sol_la_ti_do: guideScaleDegrees,
  hb_melody: guideMelodyDictation,
  chord_i_iv_v: guideChordsIIvV,
  chord_melody: guideChordsMelody,
  hb_chords: guideHbChords,
};

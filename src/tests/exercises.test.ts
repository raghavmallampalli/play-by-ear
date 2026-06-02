import { EXERCISE_HASHES } from '../constants/exercises';

describe('EXERCISE_HASHES', () => {
  test('matches exactly the stable hash mapping to avoid resetting user progress', () => {
    expect(EXERCISE_HASHES).toEqual([
      '', // 0 is unused, levels start at 1
      'do_re_mi_fa',
      'sol_la_ti_do',
      'hb_melody',
      'chord_i_iv_v',
      'chord_melody',
      'hb_chords',
      'minor_vs_major',
      'minor_vs_major_melody',
      'minor_vs_major_song',
      'dim_aug',
      'dim_aug_melody',
      'dim_aug_song',
      'sus',
      'sus_melody',
      'sus_song',
      '7th',
      '7th_melody',
      '7th_song',
    ]);
  });
});

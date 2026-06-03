/* eslint-disable @typescript-eslint/no-require-imports */
// Metro asset bundler requires static require() calls to detect and package local assets.
export interface MidiPreset {
  id: string;
  title: string;
  composer: string;
  genre: 'Classical' | 'Traditional';
  asset: any;
}

export const MIDI_PRESETS: MidiPreset[] = [
  // Classical
  {
    id: 'prelude_c',
    title: 'Prelude in C Major',
    composer: 'J.S. Bach',
    genre: 'Classical',
    asset: require('../../assets/midis/prelude_c.mid'),
  },
  {
    id: 'elise',
    title: 'Für Elise',
    composer: 'L. van Beethoven',
    genre: 'Classical',
    asset: require('../../assets/midis/elise.mid'),
  },
  {
    id: 'moonlight',
    title: 'Moonlight Sonata (Adagio)',
    composer: 'L. van Beethoven',
    genre: 'Classical',
    asset: require('../../assets/midis/moonlight.mid'),
  },
  {
    id: 'ode_to_joy',
    title: 'Ode to Joy',
    composer: 'L. van Beethoven',
    genre: 'Classical',
    asset: require('../../assets/midis/ode_to_joy.mid'),
  },
  {
    id: 'spring',
    title: 'Spring (The Four Seasons)',
    composer: 'A. Vivaldi',
    genre: 'Classical',
    asset: require('../../assets/midis/spring.mid'),
  },

  // Traditional
  {
    id: 'twinkle',
    title: 'Twinkle Twinkle Little Star',
    composer: 'Traditional',
    genre: 'Traditional',
    asset: require('../../assets/midis/twinkle.mid'),
  },
  {
    id: 'jingle_bells',
    title: 'Jingle Bells',
    composer: 'J. Pierpont',
    genre: 'Traditional',
    asset: require('../../assets/midis/jingle_bells.mid'),
  },
  {
    id: 'we_wish',
    title: 'We Wish You a Merry Christmas',
    composer: 'Traditional',
    genre: 'Traditional',
    asset: require('../../assets/midis/we_wish.mid'),
  },
];

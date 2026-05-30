export interface MidiPreset {
  id: string;
  title: string;
  composer: string;
  genre: 'Classical' | 'Traditional' | 'Video Games';
  asset: string;
}

export const MIDI_PRESETS: MidiPreset[] = [
  // Classical
  {
    id: 'prelude_c',
    title: 'Prelude in C Major',
    composer: 'J.S. Bach',
    genre: 'Classical',
    asset: '/assets/assets/midis/prelude_c.mid',
  },
  {
    id: 'elise',
    title: 'Für Elise',
    composer: 'L. van Beethoven',
    genre: 'Classical',
    asset: '/assets/assets/midis/elise.mid',
  },
  {
    id: 'moonlight',
    title: 'Moonlight Sonata (Adagio)',
    composer: 'L. van Beethoven',
    genre: 'Classical',
    asset: '/assets/assets/midis/moonlight.mid',
  },
  {
    id: 'ode_to_joy',
    title: 'Ode to Joy',
    composer: 'L. van Beethoven',
    genre: 'Classical',
    asset: '/assets/assets/midis/ode_to_joy.mid',
  },
  {
    id: 'spring',
    title: 'Spring (The Four Seasons)',
    composer: 'A. Vivaldi',
    genre: 'Classical',
    asset: '/assets/assets/midis/spring.mid',
  },

  // Traditional
  {
    id: 'twinkle',
    title: 'Twinkle Twinkle Little Star',
    composer: 'Traditional',
    genre: 'Traditional',
    asset: '/assets/assets/midis/twinkle.mid',
  },
  {
    id: 'jingle_bells',
    title: 'Jingle Bells',
    composer: 'J. Pierpont',
    genre: 'Traditional',
    asset: '/assets/assets/midis/jingle_bells.mid',
  },
  {
    id: 'we_wish',
    title: 'We Wish You a Merry Christmas',
    composer: 'Traditional',
    genre: 'Traditional',
    asset: '/assets/assets/midis/we_wish.mid',
  },

  // Video Games
  {
    id: 'mario',
    title: 'Super Mario Bros. Theme',
    composer: 'Koji Kondo',
    genre: 'Video Games',
    asset: '/assets/assets/midis/mario.mid',
  },
  {
    id: 'zelda',
    title: 'The Legend of Zelda Theme',
    composer: 'Koji Kondo',
    genre: 'Video Games',
    asset: '/assets/assets/midis/zelda.mid',
  },
  {
    id: 'tetris',
    title: 'Tetris Theme (Korobeiniki)',
    composer: 'Traditional Russian',
    genre: 'Video Games',
    asset: '/assets/assets/midis/tetris.mid',
  },
  {
    id: 'dr_mario',
    title: 'Dr. Mario Theme (Fever)',
    composer: 'Hirokazu Tanaka',
    genre: 'Video Games',
    asset: '/assets/assets/midis/dr_mario.mid',
  },
  {
    id: 'contra',
    title: 'Contra Theme',
    composer: 'Hidenori Maezawa',
    genre: 'Video Games',
    asset: '/assets/assets/midis/contra.mid',
  },
  {
    id: 'popeye',
    title: 'Popeye the Sailor Man Theme',
    composer: 'Sammy Lerner',
    genre: 'Video Games',
    asset: '/assets/assets/midis/popeye.mid',
  },
];

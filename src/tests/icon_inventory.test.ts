jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: () => null,
}));

import * as DOMIcons from '../components/icons/DOMIcons';
import * as NativeIcons from '../components/icons/NativeIcons';

describe('Icon Inventories', () => {
  test('DOMIcons exports exactly the expected components', () => {
    const exportedKeys = Object.keys(DOMIcons).sort();
    expect(exportedKeys).toEqual([
      'IconAlert',
      'IconArrowRight',
      'IconBookOpen',
      'IconCheck',
      'IconClose',
      'IconCog',
      'IconGuitar',
      'IconInfo',
      'IconInfoOutline',
      'IconKeyboard',
      'IconMelody',
      'IconPause',
      'IconPencil',
      'IconPiano',
      'IconPlay',
      'IconRestart',
      'IconTuningFork',
    ]);
  });

  test('NativeIcons exports exactly the expected components', () => {
    const exportedKeys = Object.keys(NativeIcons).sort();
    expect(exportedKeys).toEqual([
      'IconArrowLeft',
      'IconBookOpen',
      'IconCog',
      'IconPiano',
      'IconPlay',
      'IconWrench',
    ]);
  });
});

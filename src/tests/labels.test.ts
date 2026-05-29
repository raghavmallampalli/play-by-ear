import { displayLabel } from '../levels/labels';

describe('displayLabel', () => {
  describe('Melody labels', () => {
    test('renders Carnatic system correctly', () => {
      expect(displayLabel('1', 'carnatic', 'roman')).toBe('Sa');
      expect(displayLabel('2', 'carnatic', 'roman')).toBe('Re');
      expect(displayLabel('3', 'carnatic', 'roman')).toBe('Ga');
      expect(displayLabel('4', 'carnatic', 'roman')).toBe('Ma');
      expect(displayLabel('5', 'carnatic', 'roman')).toBe('Pa');
      expect(displayLabel('6', 'carnatic', 'roman')).toBe('Dha');
      expect(displayLabel('7', 'carnatic', 'roman')).toBe('Ni');
      expect(displayLabel('8', 'carnatic', 'roman')).toBe('Sa');
    });

    test('renders Solfege system correctly', () => {
      expect(displayLabel('1', 'solfege', 'roman')).toBe('Do');
      expect(displayLabel('2', 'solfege', 'roman')).toBe('Re');
      expect(displayLabel('3', 'solfege', 'roman')).toBe('Mi');
      expect(displayLabel('4', 'solfege', 'roman')).toBe('Fa');
      expect(displayLabel('5', 'solfege', 'roman')).toBe('Sol');
      expect(displayLabel('6', 'solfege', 'roman')).toBe('La');
      expect(displayLabel('7', 'solfege', 'roman')).toBe('Ti');
      expect(displayLabel('8', 'solfege', 'roman')).toBe('Do');
    });

    test('renders Numerical system correctly', () => {
      expect(displayLabel('1', 'numerical', 'roman')).toBe('1');
      expect(displayLabel('2', 'numerical', 'roman')).toBe('2');
      expect(displayLabel('8', 'numerical', 'roman')).toBe('8');
    });

    test('renders ABC system correctly with different tonics', () => {
      // Tonic: C (0)
      expect(displayLabel('1', 'abc', 'roman', 0)).toBe('C');
      expect(displayLabel('4', 'abc', 'roman', 0)).toBe('F');
      expect(displayLabel('5', 'abc', 'roman', 0)).toBe('G');
      expect(displayLabel('8', 'abc', 'roman', 0)).toBe('C');

      // Tonic: G (7)
      expect(displayLabel('1', 'abc', 'roman', 7)).toBe('G');
      expect(displayLabel('4', 'abc', 'roman', 7)).toBe('C');
      expect(displayLabel('5', 'abc', 'roman', 7)).toBe('D');
      expect(displayLabel('8', 'abc', 'roman', 7)).toBe('G');

      // Tonic: E (4)
      expect(displayLabel('1', 'abc', 'roman', 4)).toBe('E');
      expect(displayLabel('4', 'abc', 'roman', 4)).toBe('A');
      expect(displayLabel('5', 'abc', 'roman', 4)).toBe('B');
      expect(displayLabel('8', 'abc', 'roman', 4)).toBe('E');
    });
  });

  describe('Chord labels', () => {
    test('renders Roman numerals as identity', () => {
      expect(displayLabel('I', 'carnatic', 'roman')).toBe('I');
      expect(displayLabel('IV', 'carnatic', 'roman')).toBe('IV');
      expect(displayLabel('V', 'carnatic', 'roman')).toBe('V');
    });

    test('renders Absolute ABC chords with correct quality and tonic', () => {
      // Tonic: C (0)
      expect(displayLabel('I', 'carnatic', 'abc', 0)).toBe('C');
      expect(displayLabel('IV', 'carnatic', 'abc', 0)).toBe('F');
      expect(displayLabel('V', 'carnatic', 'abc', 0)).toBe('G');
      expect(displayLabel('VI', 'carnatic', 'abc', 0)).toBe('Am');
      expect(displayLabel('VII', 'carnatic', 'abc', 0)).toBe('B°');

      // Tonic: G (7)
      expect(displayLabel('I', 'carnatic', 'abc', 7)).toBe('G');
      expect(displayLabel('IV', 'carnatic', 'abc', 7)).toBe('C');
      expect(displayLabel('V', 'carnatic', 'abc', 7)).toBe('D');
    });
  });

  describe('Edge cases and passthroughs', () => {
    test('passes through unrecognized values', () => {
      expect(displayLabel('foo', 'carnatic', 'roman')).toBe('foo');
      expect(displayLabel('9', 'carnatic', 'roman')).toBe('9');
    });
  });
});

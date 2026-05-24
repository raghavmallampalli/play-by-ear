/**
 * THEORY REGISTRY
 * 
 * To support 100% offline-first playback and prevent bundle compilation crashes
 * in React Native's Metro packager, markdown guides are mapped here synchronously.
 * 
 * Source-of-truth markdown files are located in the same directory (e.g., ./9f2a8c3d.md)
 * to facilitate clean open-source contributions and easy GitHub pull requests.
 */

export const THEORY_REGISTRY: Record<string, string> = {
  '9f2a8c3d': `### Group A: Diatonic Intervals & Triads

To train relative pitch, you learn to hear intervals and chords relative to a **Tonal Center (the Tonic)**:
- **P1 (Perfect Unison):** The root tonic note itself. Sounds unified and completely resolved.
- **P5 (Perfect 5th):** The fifth scale degree. Bright, extremely hollow, and highly stable (think the *Star Wars* main theme).
- **M3 (Major 3rd):** The third scale degree. Sweet, bright, and defines the happy character of a Major Triad.

#### Memory Tricks & Active Listening
- Always tap the **Tonic** button to anchor your ears.
- **Double-tap** the Tonic button to play a full cadential **I - IV - V - I progression** before you start training!
`
};

// Map from Exercise Hash to Theory Hash
export const EXERCISE_TO_THEORY_MAP: Record<string, string> = {
  '8f3a9e2b': '9f2a8c3d', // Level 1 maps to Group A theory
  '5c4a7e9d': '9f2a8c3d', // Level 2 maps to Group A theory
  '3b8d6f1a': '9f2a8c3d', // Level 3 maps to Group A theory
};

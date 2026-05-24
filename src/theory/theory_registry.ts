/**
 * THEORY REGISTRY
 *
 * Offline-first markdown guides, keyed by hash.
 * Hash strings match the EXERCISE_HASHES in src/levels/index.ts.
 *
 * To add a new guide: add an entry here and map it in EXERCISE_TO_THEORY_MAP.
 */

export const THEORY_REGISTRY: Record<string, string> = {

  // ── Levels 1 & 2: Scale Degrees ─────────────────────────────────────────
  'guide_scale_degrees': `### Scale Degrees — The Language of Melody

Every note in the major scale has a number (scale degree) relative to the **Tonic (1)**:

| Degree | Note (C major) | Syllable | Character |
|--------|---------------|----------|-----------|
| **1**  | C | Do | Home — completely resolved |
| **2**  | D | Re | Mild tension, steps away |
| **3**  | E | Mi | Sweet, defines the major quality |
| **4**  | F | Fa | Subdominant pull, slightly tense |
| **5**  | G | Sol | Bright, stable, the "fifth" |
| **6**  | A | La | Melancholic sweetness |
| **7**  | B | Ti | Strong upward pull back to Do |
| **8**  | C (octave) | Do | Octave resolution |

#### Training Tips
- Always tap the **Tonic** button first to anchor your ears on **1 (Do)**.
- **Double-tap** Tonic to hear a full **I – IV – V – I** grounding cadence.
- Sing the scale degree number aloud as you play: "One… Three… Five…"
- Degrees **3** and **7** are the trickiest — practice them with a drone.
`,

  // ── Level 3: Melody Dictation ────────────────────────────────────────────
  'guide_melody_dictation': `### Melodic Dictation — Happy Birthday

You'll hear the **Happy Birthday** melody. Identify the **scale degree** of each note.

#### The Melody (C major)
\`\`\`
Hap-py  Birth-day  to    you    → 1 1 2 1 4 3
Hap-py  Birth-day  to    you    → 1 1 2 1 5 4
Hap-py  Birth-day  dear  [name] → 1 1 8 6 4 3 2
Hap-py  Birth-day  to    you    → 7 7 6 4 5 4
\`\`\`

#### Tips
- Listen for **contour** first (up/down/same) before committing to a degree.
- The leap to degree **8** (high Do) in bar 3 is distinctive — listen for it.
- Use the 🎵 button to replay just the melody if you're stuck.
`,

  // ── Level 4: Chord Recognition ───────────────────────────────────────────
  'guide_chords_i_iv_v': `### The Big Three — I, IV & V Chords

These three chords underpin most Western music. Each has a unique feel:

| Chord | Name | Quality | Feel |
|-------|------|---------|------|
| **I**  | Tonic | C-E-G | Home, resolved, stable |
| **IV** | Subdominant | F-A-C | Dreamy, lifted, "amen" |
| **V**  | Dominant | G-B-D | Tension, wants to resolve to I |

#### Ear Training Tricks
- **I** sounds *settled* — you want to stay here.
- **IV** sounds *lifted* but not tense (think church music).
- **V** sounds *urgent* — it strongly pulls back to I.
- Double-tap Tonic to hear them in a **I – IV – V – I** cadence first.
`,

  // ── Level 5: Chord + Melody ──────────────────────────────────────────────
  'guide_chords_melody': `### Chords With Melody

Now a **diatonic melody note** plays on top of each chord. The melody stays
inside the C major scale — your job is still to identify the **backing chord**.

#### Strategy
1. Listen to the **lowest notes** first — the bass outlines the chord.
2. The melody note may or may not be part of the chord. Don't let it distract you.
3. Ask yourself: does it feel *home (I)*, *lifted (IV)*, or *tense (V)*?

> The melody note is always diatonic (in C major), so it will never clash — use the overall *mood* of the sound to identify the chord.
`,

  // ── Level 6: Happy Birthday + Chords ────────────────────────────────────
  'guide_hb_chords': `### Happy Birthday — Full Harmonization

You'll hear the **Happy Birthday melody** with **chord accompaniment**.
Identify the chord for each bar.

#### Traditional Harmonization (C major)
\`\`\`
"Happy birthday to you"    → I  (bars 1-2)
"Happy birthday to you"    → V → I
"Happy birthday dear …"    → I → IV → I
"Happy birthday to you"    → V → I
\`\`\`

#### Tips
- The chord changes happen at **bar boundaries** — listen for the bass shift.
- **V → I** (the cadence) always sounds like tension resolving to home.
- If unsure, ask: does the passage sound *stable*, *lifted*, or *pulling*?
`,
};

/** Maps exercise hash → theory hash. */
export const EXERCISE_TO_THEORY_MAP: Record<string, string> = {
  'lvl1_do_re_mi_fa':  'guide_scale_degrees',
  'lvl2_sol_la_ti_do': 'guide_scale_degrees',
  'lvl3_hb_melody':    'guide_melody_dictation',
  'lvl4_chord_i_iv_v': 'guide_chords_i_iv_v',
  'lvl5_chord_melody': 'guide_chords_melody',
  'lvl6_hb_chords':    'guide_hb_chords',
};

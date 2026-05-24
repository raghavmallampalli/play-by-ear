import { z } from 'zod';

/**
 * RelativeNoteSchema
 * Represents a note relative to a tonic pitch class and a base octave.
 */
export const RelativeNoteSchema = z.object({
  /** Degree: Semitone offset from the tonic (0 to 11). 0 is the tonic itself. */
  degree: z.number().int().min(0).max(11),
  /** Offset: Octave offset relative to the base octave. 0 means the base octave. */
  offset: z.number().int(),
});

export type RelativeNote = z.infer<typeof RelativeNoteSchema>;

/**
 * PlayedNoteSchema
 * A single note played at a specific time (beat) for a specific duration.
 * Time and duration are measured in integer ticks (e.g., 480 ticks per quarter note).
 */
export const PlayedNoteSchema = z.object({
  note: RelativeNoteSchema,
  /** Start time in ticks. */
  beat: z.number().int().nonnegative(),
  /** Duration in ticks. */
  duration: z.number().int().positive(),
});

export type PlayedNote = z.infer<typeof PlayedNoteSchema>;

/**
 * PlayedChordSchema
 * Multiple notes played simultaneously (or with internal offsets if represented as multiple PlayedNotes).
 * For simplicity in high-level definitions, this group shares a start beat and duration.
 */
export const PlayedChordSchema = z.object({
  notes: z.array(RelativeNoteSchema).nonempty(),
  /** Start time in ticks. */
  beat: z.number().int().nonnegative(),
  /** Duration in ticks. */
  duration: z.number().int().positive(),
});

export type PlayedChord = z.infer<typeof PlayedChordSchema>;

/**
 * SongSchema
 * A complete exercise defined by a melody and a chord progression.
 */
export const SongSchema = z.object({
  melody: z.array(PlayedNoteSchema),
  chords: z.array(PlayedChordSchema),
});

export type Song = z.infer<typeof SongSchema>;

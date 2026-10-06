import { z } from "zod";
import { ADJECTIVES, MAX_NAME_NUMBER, NOUNS } from "@/lib/game/nicknames";
import { DIFFICULTIES, MAPS } from "@/lib/game/scoring";

export const mapSchema = z.enum(MAPS);
export const difficultySchema = z.enum(DIFFICULTIES);

/** Sıralamadaki ad serbest metin değildir; yalnızca sözcük listesi sıra numaraları kabul edilir. */
export const nameSelectionSchema = z.object({
  adjective: z.number().int().min(0).max(ADJECTIVES.length - 1),
  noun: z.number().int().min(0).max(NOUNS.length - 1),
  number: z.number().int().min(0).max(MAX_NAME_NUMBER),
});

export const startRequestSchema = z.object({
  map: mapSchema,
  difficulty: difficultySchema,
});

export const hintRequestSchema = z.object({
  sessionId: z.uuid(),
});

export const guessRequestSchema = z.object({
  sessionId: z.uuid(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const nextRequestSchema = z.object({
  sessionId: z.uuid(),
  name: nameSelectionSchema.optional(),
});

export const PERIODS = ["all", "week"] as const;

export const leaderboardQuerySchema = z.object({
  map: mapSchema,
  difficulty: difficultySchema.optional(),
  period: z.enum(PERIODS).default("all"),
  sessionId: z.uuid().optional(),
});

export type StartRequest = z.infer<typeof startRequestSchema>;
export type GuessRequest = z.infer<typeof guessRequestSchema>;

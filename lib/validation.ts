import { z } from "zod";
import { containsProfanity } from "@/lib/game/profanity";
import { DIFFICULTIES, MAPS } from "@/lib/game/scoring";

export const mapSchema = z.enum(MAPS);
export const difficultySchema = z.enum(DIFFICULTIES);

export const NICKNAME_MIN = 2;
export const NICKNAME_MAX = 20;

export const nicknameSchema = z
  .string()
  .trim()
  .min(NICKNAME_MIN, `Takma ad en az ${NICKNAME_MIN} karakter olmalı`)
  .max(NICKNAME_MAX, `Takma ad en fazla ${NICKNAME_MAX} karakter olabilir`)
  .refine((v) => !containsProfanity(v), "Bu takma ad kullanılamaz");

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
  nickname: nicknameSchema.optional(),
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

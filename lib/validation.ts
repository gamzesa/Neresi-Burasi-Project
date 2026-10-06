import { z } from "zod";
import { containsProfanity } from "@/lib/game/profanity";
import { DIFFICULTIES, MAPS } from "@/lib/game/scoring";

export const mapSchema = z.enum(MAPS);
export const difficultySchema = z.enum(DIFFICULTIES);

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;
export const PASSWORD_MIN = 8;
/** bcrypt 72 baytın ötesini yok sayar; daha uzun şifreyi baştan reddederiz. */
export const PASSWORD_MAX = 72;

/** Taklit ve yanıltıcı adları önlemek için ayrılmış kullanıcı adları. */
const RESERVED_USERNAMES = ["admin", "administrator", "moderator", "destek", "sistem", "root", "neresiburasi", "neresi_burasi"];

export const usernameSchema = z
  .string()
  .trim()
  .min(USERNAME_MIN, `Kullanıcı adı en az ${USERNAME_MIN} karakter olmalı`)
  .max(USERNAME_MAX, `Kullanıcı adı en fazla ${USERNAME_MAX} karakter olabilir`)
  .regex(/^[A-Za-z0-9_]+$/, "Kullanıcı adı yalnızca harf, rakam ve alt çizgi içerebilir (Türkçe karakter kullanılamaz)")
  .refine((v) => !RESERVED_USERNAMES.includes(v.toLowerCase()), "Bu kullanıcı adı kullanılamaz")
  .refine((v) => !containsProfanity(v), "Bu kullanıcı adı kullanılamaz");

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email("Geçerli bir e-posta adresi gir"));

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN, `Şifre en az ${PASSWORD_MIN} karakter olmalı`)
  .max(PASSWORD_MAX, `Şifre en fazla ${PASSWORD_MAX} karakter olabilir`);

export const registerRequestSchema = z.object({
  email: emailSchema,
  username: usernameSchema,
  password: passwordSchema,
});

export const loginRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Şifreni gir").max(PASSWORD_MAX),
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
});

export const claimRequestSchema = z.object({
  sessionId: z.uuid(),
});

export const PERIODS = ["all", "week"] as const;

export const leaderboardQuerySchema = z.object({
  map: mapSchema,
  difficulty: difficultySchema.optional(),
  period: z.enum(PERIODS).default("all"),
});

export type StartRequest = z.infer<typeof startRequestSchema>;
export type GuessRequest = z.infer<typeof guessRequestSchema>;
export type RegisterRequest = z.infer<typeof registerRequestSchema>;

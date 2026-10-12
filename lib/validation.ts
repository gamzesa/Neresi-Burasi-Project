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

export const forgotPasswordRequestSchema = z.object({
  email: emailSchema,
});

export const resetPasswordRequestSchema = z.object({
  password: passwordSchema,
});

export const chooseUsernameRequestSchema = z.object({
  username: usernameSchema,
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

export const NICKNAME_MIN = 2;
export const NICKNAME_MAX = 20;

/** Misafirin oda içinde göreceği takma ad; Türkçe karakter ve boşluk serbesttir, küfür filtresinden geçer. */
export const nicknameSchema = z
  .string()
  .trim()
  .min(NICKNAME_MIN, `Takma ad en az ${NICKNAME_MIN} karakter olmalı`)
  .max(NICKNAME_MAX, `Takma ad en fazla ${NICKNAME_MAX} karakter olabilir`)
  .refine((v) => !containsProfanity(v), "Bu takma ad kullanılamaz");

const roomCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-HJ-NP-Z2-9]{5}$/, "Oda kodu 5 karakterli olmalı");

const playerTokenSchema = z.string().min(16).max(128);

export const createRoomRequestSchema = z.object({
  map: mapSchema,
  difficulty: difficultySchema,
  /** Girişli kullanıcı için kullanıcı adı kullanılır; misafirde zorunludur. */
  nickname: nicknameSchema.optional(),
});

export const joinRoomRequestSchema = z.object({
  code: roomCodeSchema,
  nickname: nicknameSchema.optional(),
});

export const roomStateRequestSchema = z.object({
  code: roomCodeSchema,
  playerToken: playerTokenSchema,
});

export const roomGuessRequestSchema = roomStateRequestSchema.extend({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const rematchRequestSchema = roomStateRequestSchema.extend({
  action: z.enum(["request", "accept", "decline"]),
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

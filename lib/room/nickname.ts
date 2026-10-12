import { getCurrentUser } from "@/lib/auth/server";
import { GameError } from "@/lib/game/service";

/** Girişli kullanıcıda kullanıcı adı, misafirde istekteki takma ad kullanılır. */
export async function resolvePlayer(nickname: string | undefined) {
  const user = await getCurrentUser();
  const name = user?.username ?? nickname;
  if (!name) throw new GameError(400, "Takma adını gir.");
  return { nickname: name, userId: user?.id ?? null };
}

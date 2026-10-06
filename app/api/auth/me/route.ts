import { z } from "zod";
import { getRoute } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth/server";

export const GET = getRoute(z.object({}), async () => {
  const user = await getCurrentUser();
  return { user: user ? { username: user.username } : null };
});

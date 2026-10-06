import { notFound, redirect } from "next/navigation";
import GameScreen from "@/components/game/GameScreen";
import { getCurrentUser } from "@/lib/auth/server";
import { difficultySchema, mapSchema } from "@/lib/validation";

export default async function PlayPage({
  params,
  searchParams,
}: {
  params: Promise<{ map: string }>;
  searchParams: Promise<{ difficulty?: string }>;
}) {
  const map = mapSchema.safeParse((await params).map);
  if (!map.success) notFound();
  const difficulty = difficultySchema.safeParse((await searchParams).difficulty);
  // Zorluk seçilmeden oyun başlamaz; ana sayfaya dön.
  if (!difficulty.success) redirect("/");
  const user = await getCurrentUser();
  return <GameScreen map={map.data} difficulty={difficulty.data} user={user ? { username: user.username } : null} />;
}

import LeaderboardView from "@/components/leaderboard/LeaderboardView";
import { getCurrentUser } from "@/lib/auth/server";
import { mapSchema } from "@/lib/validation";

export const metadata = { title: "Sıralama · Neresi Burası?" };

export default async function LeaderboardPage({ searchParams }: { searchParams: Promise<{ map?: string }> }) {
  const map = mapSchema.catch("world").parse((await searchParams).map);
  const user = await getCurrentUser();
  return <LeaderboardView initialMap={map} user={user ? { username: user.username } : null} />;
}

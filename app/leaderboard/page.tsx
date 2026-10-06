import LeaderboardView from "@/components/leaderboard/LeaderboardView";
import { mapSchema } from "@/lib/validation";
import { z } from "zod";

export const metadata = { title: "Sıralama · Neresi Burası?" };

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ map?: string; sessionId?: string }>;
}) {
  const params = await searchParams;
  const map = mapSchema.catch("world").parse(params.map);
  const sessionId = z.uuid().safeParse(params.sessionId);
  return <LeaderboardView initialMap={map} sessionId={sessionId.success ? sessionId.data : undefined} />;
}

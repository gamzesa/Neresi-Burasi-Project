import { notFound } from "next/navigation";
import RoomScreen from "@/components/room/RoomScreen";
import { getCurrentUser } from "@/lib/auth/server";
import { normalizeRoomCode } from "@/lib/room/service";

const CODE_PATTERN = /^[A-HJ-NP-Z2-9]{5}$/;

export default async function RoomPage({ params }: { params: Promise<{ code: string }> }) {
  const code = normalizeRoomCode((await params).code);
  if (!CODE_PATTERN.test(code)) notFound();
  const user = await getCurrentUser();
  return <RoomScreen code={code} user={user ? { username: user.username } : null} />;
}

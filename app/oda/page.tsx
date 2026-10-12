import RoomLobby from "@/components/room/RoomLobby";
import { getCurrentUser } from "@/lib/auth/server";

export default async function RoomLobbyPage() {
  const user = await getCurrentUser();
  return <RoomLobby user={user ? { username: user.username } : null} />;
}

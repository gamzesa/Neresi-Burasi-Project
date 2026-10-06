import HomeMenu from "@/components/HomeMenu";
import { getCurrentUser } from "@/lib/auth/server";

export default async function HomePage() {
  const user = await getCurrentUser();
  return <HomeMenu user={user ? { username: user.username } : null} />;
}

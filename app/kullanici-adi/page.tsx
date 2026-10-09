import { redirect } from "next/navigation";
import { z } from "zod";
import ChooseUsernameForm from "@/components/auth/ChooseUsernameForm";
import { safeNextPath } from "@/lib/auth/redirect";
import { getAuthUser } from "@/lib/auth/server";

export const metadata = { title: "Kullanıcı adı seç · Neresi Burası?" };

export default async function ChooseUsernamePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; claim?: string }>;
}) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  const user = await getAuthUser();
  if (!user) redirect(`/giris?next=${encodeURIComponent(next)}`);
  if (user.username) redirect(next);
  const claim = z.uuid().safeParse(params.claim);
  return <ChooseUsernameForm next={next} claimSessionId={claim.success ? claim.data : undefined} />;
}

import { redirect } from "next/navigation";
import { z } from "zod";
import AuthForm from "@/components/auth/AuthForm";
import { safeNextPath } from "@/lib/auth/redirect";
import { getCurrentUser } from "@/lib/auth/server";

export const metadata = { title: "Kayıt ol · Neresi Burası?" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; claim?: string }>;
}) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  if (await getCurrentUser()) redirect(next);
  const claim = z.uuid().safeParse(params.claim);
  return <AuthForm mode="register" next={next} claimSessionId={claim.success ? claim.data : undefined} />;
}

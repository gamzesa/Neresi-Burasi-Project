import { redirect } from "next/navigation";
import DeleteAccountForm from "@/components/auth/DeleteAccountForm";
import { expectedDeletionConfirmation } from "@/lib/auth/deletion";
import { getAuthUser } from "@/lib/auth/server";

export const metadata = { title: "Hesabı sil · Neresi Burası?" };

export default async function DeleteAccountPage() {
  const user = await getAuthUser();
  if (!user) redirect("/giris");
  return <DeleteAccountForm confirmWord={expectedDeletionConfirmation(user.username)} />;
}

import { postRoute } from "@/lib/api";
import { deleteAccount } from "@/lib/auth/accounts";
import { deleteAccountRequestSchema } from "@/lib/validation";

export const POST = postRoute(deleteAccountRequestSchema, ({ confirmation }) => deleteAccount(confirmation));

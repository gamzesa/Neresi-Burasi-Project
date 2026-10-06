import { postRoute } from "@/lib/api";
import { loginAccount } from "@/lib/auth/accounts";
import { loginRequestSchema } from "@/lib/validation";

export const POST = postRoute(loginRequestSchema, (input) => loginAccount(input));

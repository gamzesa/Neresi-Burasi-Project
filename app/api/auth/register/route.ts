import { postRoute } from "@/lib/api";
import { registerAccount } from "@/lib/auth/accounts";
import { registerRequestSchema } from "@/lib/validation";

export const POST = postRoute(registerRequestSchema, (input) => registerAccount(input));

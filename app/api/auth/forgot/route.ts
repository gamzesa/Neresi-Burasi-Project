import { postRoute } from "@/lib/api";
import { requestPasswordReset } from "@/lib/auth/accounts";
import { forgotPasswordRequestSchema } from "@/lib/validation";

export const POST = postRoute(forgotPasswordRequestSchema, ({ email }) => requestPasswordReset(email));

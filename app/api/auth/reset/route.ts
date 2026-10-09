import { postRoute } from "@/lib/api";
import { resetPassword } from "@/lib/auth/accounts";
import { resetPasswordRequestSchema } from "@/lib/validation";

export const POST = postRoute(resetPasswordRequestSchema, ({ password }) => resetPassword(password));

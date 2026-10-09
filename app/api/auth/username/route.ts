import { postRoute } from "@/lib/api";
import { chooseUsername } from "@/lib/auth/accounts";
import { chooseUsernameRequestSchema } from "@/lib/validation";

export const POST = postRoute(chooseUsernameRequestSchema, ({ username }) => chooseUsername(username));

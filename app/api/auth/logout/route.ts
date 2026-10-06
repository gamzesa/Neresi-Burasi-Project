import { z } from "zod";
import { postRoute } from "@/lib/api";
import { logoutAccount } from "@/lib/auth/accounts";

export const POST = postRoute(z.object({}), () => logoutAccount());

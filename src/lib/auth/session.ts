import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { openSession, SESSION_COOKIE } from "./security";

export const getInvestorUser = cache(async () => {
  const cookie = (await cookies()).get(SESSION_COOKIE)?.value;
  return openSession(cookie, process.env.SESSION_SECRET);
});

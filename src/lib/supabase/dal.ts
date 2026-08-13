import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Authoritative auth check for Server Components/Actions — unlike the
 * optimistic cookie check in src/proxy.ts, getUser() revalidates against
 * the Supabase Auth server. Memoized per request so the (app) layout and
 * every page under it share one network call instead of one each.
 */
export const requireUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return user;
});

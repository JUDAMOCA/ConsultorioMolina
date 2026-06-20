import { cache } from "react";
import type { User } from "@supabase/supabase-js";

import { createServerSupabaseClient } from "@/lib/supabase-server";

export type Role = "patient" | "dentist";

// Per-request memoized auth reads. `cache()` dedupes these across every Server
// Component in a single render pass, so multiple page gates + the Navbar share
// one `auth.getUser()` round-trip instead of each firing their own
// (vercel-react-best-practices: `server-cache-react`).
//
// This module transitively imports `@/lib/supabase-server` (which uses
// `next/headers`), so it can never be bundled into a Client Component.

export const getSessionUser = cache(async (): Promise<User | null> => {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

const getSessionRole = cache(async (): Promise<Role | null> => {
  const user = await getSessionUser();
  if (!user) return null;
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return (data?.role as Role | undefined) ?? null;
});

export const getSessionProfile = cache(
  async (): Promise<{ user: User | null; role: Role | null }> => {
    const user = await getSessionUser();
    if (!user) return { user: null, role: null };
    return { user, role: await getSessionRole() };
  },
);
